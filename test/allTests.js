const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace");
const hre = require('hardhat');
const chai = require('chai');
const {solidity} = require('ethereum-waffle');
chai.use(solidity);
const {expect} = chai;

describe("Deploy and Premint", function () {
    let testContractAddress = "";
    const acceptedCurrencies = [
        "0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83",  //WFTM
        "0x21Ada0D2aC28C3A5Fa3cD2eE30882dA8812279B6"   //OATH
    ];

    const prices = [
        ethers.utils.parseUnits('0.0001', 'ether'), //WFTM
        ethers.utils.parseUnits('0.0001', 'ether')  //USDC
    ];

    const collections = [
        "0x25ff0d27395A7AAD578569f83E30C82a07b4ee7d", //Skully
        "0x5ba5168a88b4f1c41fe71f59ddfa2305e0dbda8c", //PopPussies
        "0xe92752C25111DB288665766aD8aDB624CCf91045", //Bitshadowz
        "0xC369d0c7f27c51176dcb01802D6Bca2b3Eb0b8dC", //BitWitches
        "0x5ed7893b8cf0f9199aa2760648779cb5d96716ae", //Mingoes
        "0xa70aa1f9da387b815Facd5B823F284F15EC73884", //Frogs
        "0x590e13984295df26c68f8c89f32fcf3a9f08177f", //PocketPals
        "0x4f504ab2e7b196a4165ab3db71e75cb2b37070e0", //RiotGoool
        "0x0ef9d39bbbed9c4983ddc4a1e189ee4938d837b3", //Hamsteria
        "0x0ef9d39bbbed9c4983ddc4a1e189ee4938d837b3"  //CosmicHorrors
    ];

    const discounts = [
        66,
        66,
        66,
        66,
        66,
        66,
        66,
        66,
        66,
        50
    ];
    beforeEach(async function () {
        //reset network
          await network.provider.request({
            method: "hardhat_reset",
            params: [{
              forking: {
                jsonRpcUrl: "https://late-wild-fire.fantom.quiknode.pro/",
              }
            }]
          });
          //get signers
          [owner, addr1, addr2, addr3, addr4, ...addrs] = await ethers.getSigners();
          await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: ["0x60BC5E0440C867eEb4CbcE84bB1123fad2b262B1"]}
          );
          self = await ethers.provider.getSigner("0xF1a26c9f2978aB1CA4659d3FbD115845371ED0F5");
          selfAddress = await self.getAddress();
          ownerAddress = await owner.getAddress();
    });
    it("Contract should deploy", async function () {
        const CCContract = hre.ethers.getContractFactory("CursedCircusTest");
        const connected = CCContract.deploy(
            "CCTEST",
            "",
            "0x2b4C76d0dc16BE1C31D4C1DC53bF9B45987Fc75c",
            "0x1740Eae421b6540fda3924bE59F549c00AB67575",
            5,
            130,
            5,
            {gasLimit: 8000000, gasPrice: ethers.utils.parseUnits('3000', 'gwei')}
        );
        await connected.deployed();
        testContractAddress = connected.address;
        console.log("Deployed to: ", connected.address);
    });
    it("Premint should be completed", async function () {
        const CCContract = hre.ethers.getContractFactory("CursedCircusTest");
        const connected = CCContract.attach(testContractAddress);
        let tx = await connected.premintTokens({gasLimit: 8000000, gasPrice: ethers.utils.parseUnits('3000', 'gwei')});
        await tx.wait();
        let totalSupply = await connected.totalSupply();
        expect(totalSupply).to.be.equal(60);
        console.log("Minted first 60");
    
        tx = await connected.premintTokens({gasLimit: 8000000, gasPrice: ethers.utils.parseUnits('3000', 'gwei')});
        await tx.wait();
        totalSupply = await connected.totalSupply();
        expect(totalSupply).to.be.equal(120);
        console.log("Minted second 60");
    });
    it("Set price/currency, unpause mint, and set discounts", async function () {
        const CCContract = hre.ethers.getContractFactory("CursedCircusTest");
        const connected = CCContract.attach(testContractAddress);
        let tx = await connected.addCurrency(acceptedCurrencies, prices, {gasPrice: ethers.utils.parseUnits('6000', 'gwei')});
        await tx.wait();
        console.log("Added Currencies: " + acceptedCurrencies + " @ Prices: " + prices);
      
        tx = await connected.setDiscountCollections(collections, discounts, {gasPrice: ethers.utils.parseUnits('6000', 'gwei')});
        await tx.wait();
        console.log("Added collections: " + collections + " @ Discounts: " + discounts); 

        tx = await connected.pausePublic(false, {gasPrice: ethers.utils.parseUnits('6000', 'gwei')});
        await tx.wait();

        const status = await connected.publicPaused()
        console.log("Unpaused Public with status: ", status);
    });
    it("Test mints", async function () {
        const CCContract = hre.ethers.getContractFactory("CursedCircusTest");
        const connected = CCContract.attach(testContractAddress);
        for(i = 121; i <= 130; i++) {
            tx = await connected.mint("0x0000000000000000000000000000000000000000", 1, "0x0000000000000000000000000000000000000000", {gasLimit: 1000000, value: ethers.utils.parseUnits('0.0001', 'ether')});
            await tx.wait();
            console.log("Minted token: ", i);
        }
    });
});