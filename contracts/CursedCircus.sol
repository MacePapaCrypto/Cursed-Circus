// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC2981.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "./IWrappedFantom.sol";
import "./IElasticLGE.sol";
import "./Math.sol";


/* Custom Error Section - Use with ethers.js for custom errors */
// Public Mint is Paused
error MintPaused();

// Cannot mint zero NFTs
error AmountLessThanOne();

// Cannot mint more than maxMintAmount
error AmountOverMax(uint256 amtMint, uint256 maxMint);

// Token not in Auth List
error TokenNotAuthorized();

// Not enough mints left for mint amount
error NotEnoughMintsLeft(uint256 supplyLeft, uint256 amtMint);

// Not enough ftm sent to mint
error InsufficientFTM(uint256 totalCost, uint256 amtFTM);

contract CursedCircus is ERC721Enumerable, Ownable, ERC2981 {
  using Strings for uint256;

  string baseURI;
  string public baseExtension = ".json";

  IElasticLGE LGEContract = IElasticLGE(0x96662f375a9734654cB57BbFeb31Db9dD7784A7F);
  address public lpPair; // = 0x2b4C76d0dc16BE1C31D4C1DC53bF9B45987Fc75c; - usdcftm pair
  IWrappedFantom wftm = IWrappedFantom(0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83);
  //Team wallets
  address[] private team = [
    0x962A2880Eb188AB4C2Cfe9874247fCC60a243d13, //25% Mace
    0x1740Eae421b6540fda3924bE59F549c00AB67575, //30% Noob
    0xEeE32847C124963ACd2b0a36310AE07af6C86a7B, //25% Munchies
    0x3F79ddf852bFbB6d13A704C1EdbE8DfD40B4E088, //10% KB
    0xc78E8ea590C6C75C346FE8c7b1eF302cfFb9aF0a  //10% Corval
  ];

  mapping(address => uint) public collectionsWithDiscount;

  //@audit cost too low?
  mapping(address => uint) public acceptedCurrencies;

  uint256 public immutable maxSupply; //2000
  uint256 public immutable maxMintAmount; //5

  bool public publicPaused = true;
  uint16[130] private ids;
  uint16 private index = 0;

  constructor(
    string memory _name,
    string memory _symbol,
    string memory _initBaseURI, //""
    address _lpPair,
    address _royaltyAddress,
    uint _royaltiesPercentage,
    uint _maxSupply,
    uint _maxMintAmount
  ) ERC721(_name, _symbol) {
        maxSupply = _maxSupply;
        maxMintAmount = _maxMintAmount;
        lpPair = _lpPair; 
        _setReceiver(_royaltyAddress);
        setBaseURI(_initBaseURI);
        _setRoyaltyPercentage(_royaltiesPercentage);
  }

  //address oath = 0x21Ada0D2aC28C3A5Fa3cD2eE30882dA8812279B6;
  //address wftm = 0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83;
  function addCurrency(address[] calldata acceptedCurrenciesInput, uint256[] calldata prices) external onlyOwner {
    require(acceptedCurrenciesInput.length == prices.length, "improper length");
    uint len = prices.length;
    for(uint i; i < len; ++i) {
        if (acceptedCurrenciesInput[i] == address(wftm)) {
            acceptedCurrencies[address(0)] = prices[i];
        }
        acceptedCurrencies[acceptedCurrenciesInput[i]] = prices[i];
    }
  }

  // internal
  function _baseURI() internal view virtual override returns (string memory) {
    return baseURI;
  }

  //Likely need to call twice to mint all 120
  function premintTokens() external onlyOwner {
    uint supply = totalSupply();
    uint len = 0;
    require(supply < 120, "Too many tokens preminted");
    for(uint i = 1; i <= 60; i++) {
      len = ids.length - index++;
      ids[supply + 1] = uint16(ids[len - 1] == 0 ? len - 1 : ids[len - 1]);
      ids[len - 1] = 0;
      _safeMint(msg.sender, supply+1);
      supply++;
    }
  }

  function _pickRandomUniqueId(uint256 _random) private returns (uint256 id) {
      uint256 len = ids.length - index++;
      require(len > 0, "no ids left");
      uint256 randomIndex = _random % len;
      id = ids[randomIndex] != 0 ? ids[randomIndex] : randomIndex;
      ids[randomIndex] = uint16(ids[len - 1] == 0 ? len - 1 : ids[len - 1]);
      ids[len - 1] = 0;
  }

  function _getDiscount(address collection) internal returns(uint percentDiscount) {
    //First check if they have 50% discount from LGE
    //only need to return 1 of the two values. Both will be 0 if not participated
    uint lgePercentDiscount = 100;
    Terms memory termReturn = LGEContract.terms(msg.sender);
    if(collection == address(0)) {
      percentDiscount = 100;
    }
    else if(ERC721(collection).balanceOf(msg.sender) > 0) {
      //Discount is 33%, so need to return 66
      percentDiscount = collectionsWithDiscount[collection];
    }
    if(termReturn.term > 0) {
      lgePercentDiscount = 100 - _curve(termReturn.term);
    }
    else {
      percentDiscount = 100;
    }
    return Math.min(percentDiscount, lgePercentDiscount);
  }

  function _curve(uint term) internal returns (uint) {
    uint discount = Math.sqrt(term) / 400;
    if(discount < 35) {
      discount = 35;
    }
    else if(discount > 50) {
      discount = 50;
    }
    return Math.min(50, discount);
  } 

  function mint(address token, uint amount, address collection) external payable returns (uint) {
    //mint is closed
    if(publicPaused)
      revert MintPaused();
    if(amount <= 0)
      revert AmountLessThanOne();
    //require(amount > 0, 'Cannot mint 0');
    if(amount > maxMintAmount) {
      revert AmountOverMax({
        amtMint: amount,
        maxMint: maxMintAmount
      });
    }
    if(acceptedCurrencies[token] <= 0)
      revert TokenNotAuthorized();
    //require(acceptedCurrencies[token] > 0, "token not authorized");

    uint256 supply = totalSupply();
    if(supply + amount > maxSupply) {
      revert NotEnoughMintsLeft({
        supplyLeft: maxSupply - supply,
        amtMint: amount
      });
    }

    //All check have passed, we can mint after applying a discount to the cost
    uint discountPercentage = _getDiscount(collection);
    //If no discount, then returned discount percentage is zero. We need to return 100 in order to have the math cancel out to cost * 1

    uint amountFromSender = msg.value;
    if (token == address(0)) {
        if(amountFromSender != amount * acceptedCurrencies[address(wftm)] * (discountPercentage / 100))
          revert InsufficientFTM({
            totalCost: amount * acceptedCurrencies[address(wftm)] * (discountPercentage / 100),
            amtFTM: amountFromSender
          });
        //require(msg.value == amount * acceptedCurrencies[address(wftm)], "insufficient ftm");
        wftm.deposit{ value: amountFromSender }();
        _mintInternal(amount);
    } else {
        require(IERC20(token).transferFrom(msg.sender, address(this), amount * acceptedCurrencies[token] * (discountPercentage / 100)), "Payment not successful");
        _mintInternal(amount);
    }

  }

  function _mintInternal(uint _amount) internal {
      for (uint256 i = 1; i <= _amount; ++i) {
          _safeMint(msg.sender, _pickRandomUniqueId(_getRandom()) +1);
      }
  }

  function _getRandom() internal returns (uint) {
      (uint token0, uint token1) = _getRandomNumbers();
      return uint(keccak256(abi.encodePacked(
          token0, token1
      )));
  }

  function _getRandomNumbers() internal returns (uint, uint) {
      (uint token0, uint token1,) = IUniswapV2Pair(lpPair).getReserves();
      return (token0, token1);
  }

  function walletOfOwner(address _owner)
    public
    view
    returns (uint256[] memory)
  {
    uint256 ownerTokenCount = balanceOf(_owner);
    uint256[] memory tokenIds = new uint256[](ownerTokenCount);
    for (uint256 i; i < ownerTokenCount; i++) {
      tokenIds[i] = tokenOfOwnerByIndex(_owner, i);
    }
    return tokenIds;
  }

  function tokenURI(uint256 tokenId)
    public
    view
    virtual
    override
    returns (string memory)
  {
    require(
      _exists(tokenId),
      "ERC721Metadata: URI query for nonexistent token"
    );

    string memory currentBaseURI = _baseURI();
    return bytes(currentBaseURI).length > 0
        ? string(abi.encodePacked(currentBaseURI, tokenId.toString(), baseExtension))
        : "";
  }

  function setDiscountCollections(address[] calldata _collectionAddresses, uint[] calldata _discounts) public onlyOwner {
    require(_collectionAddresses.length == _discounts.length, "Array lengths don't match");
    uint len = _collectionAddresses.length;
    for(uint i = 0; i < len; i++) {
      collectionsWithDiscount[_collectionAddresses[i]] = _discounts[i];
    }
  }

  function setBaseURI(string memory _newBaseURI) public onlyOwner {
    baseURI = _newBaseURI;
  }

  function setBaseExtension(string memory _newBaseExtension) public onlyOwner {
    baseExtension = _newBaseExtension;
  }

  function pausePublic(bool _state) public onlyOwner {
    publicPaused = _state;
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721Enumerable, IERC165, ERC165Storage) returns (bool) {
    return super.supportsInterface(interfaceId);
  }

  function withdraw(address token) external onlyOwner {
    require(acceptedCurrencies[token] > 0, "token not authorized");
    uint amount = IERC20(token).balanceOf(address(this));
    require(amount > 0);
    
    if(token == address(0)) {
        //This should only need to be called if a bug occurs and FTM (not wFTM) is sent to the contract
        payable(msg.sender).transfer(address(this).balance);
    }
    else {
      IERC20(token).transfer(team[0], amount * 25 / 100);
      IERC20(token).transfer(team[1], amount * 30 / 100);
      IERC20(token).transfer(team[2], amount * 25 / 100);
      IERC20(token).transfer(team[3], amount * 10 / 100);
      IERC20(token).transfer(team[4], amount * 10 / 100);
    }
  }
}