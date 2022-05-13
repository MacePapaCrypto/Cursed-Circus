// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { time } = require("console");
const { mnemonicToEntropy } = require("ethers/lib/utils");
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const testArray = [
    '0x962A2880Eb188AB4C2Cfe9874247fCC60a243d13'
  ];

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

  const PopContract = await hre.ethers.getContractFactory("CursedCircus");
  //const connected = await PopContract.attach("0xe984EfF2D70452f52527171b39004503683D5bb7");
  //const ERC20Contract = await hre.ethers.getContractFactory("ERC20");
  //const erc20Connected = await ERC20Contract.attach("0xFb24bC6E1cE0e9f6ceb633FeF2127c2826d8820E");
  //await erc20Connected.approve("0x6C6BAFDf153Db9eC245f957Bc58794f03D65ac80", ethers.utils.parseUnits('1', 'ether'));*/
  const connected = await PopContract.deploy(
    "CursedCircusTest",
    "CCTEST",
    "",
    "0x2b4C76d0dc16BE1C31D4C1DC53bF9B45987Fc75c",
    "0x1740Eae421b6540fda3924bE59F549c00AB67575",
    5,
    130,
    5,
    {gasLimit: 8000000, gasPrice: ethers.utils.parseUnits('6000', 'gwei')}
  );
  await connected.deployed();
  console.log("Deployed to: ", connected.address);
  //console.log(ethers.utils.parseUnits('0.00001', 'ether'));*/
  try {
    tx = await connected.premintTokens({gasLimit: 8000000, gasPrice: ethers.utils.parseUnits('7000', 'gwei')});
    await tx.wait();
    console.log("Minted first 60");

    tx = await connected.premintTokens({gasLimit: 8000000, gasPrice: ethers.utils.parseUnits('7000', 'gwei')});
    await tx.wait();
    console.log("Minted second 60");
    
    tx = await connected.addCurrency(acceptedCurrencies, prices, {gasPrice: ethers.utils.parseUnits('6000', 'gwei')});
    await tx.wait();
    console.log("Added Currencies");
  
    const status = await connected.pausePublic(false, {gasPrice: ethers.utils.parseUnits('6000', 'gwei')});
    await status.wait();
    console.log("Unpaused Public");

    tx = await connected.setDiscountCollections(collections, discounts, {gasPrice: ethers.utils.parseUnits('6000', 'gwei')});
    await tx.wait();
    console.log("Added collection discounts"); 

    for(i = 121; i <= 130; i++) {
      tx = await connected.mint("0x0000000000000000000000000000000000000000", 1, "0x0ef9d39bbbed9c4983ddc4a1e189ee4938d837b3", {gasLimit: 1000000, value: ethers.utils.parseUnits('0.0001', 'ether')});
      await tx.wait();
      console.log("Minted token: ", i);
    }

    /*await connected.mint(1, {gasLimit: 300000, value: ethers.utils.parseUnits('1', 'ether')});
    console.log("minted");
    await connected.withdraw("0x0000000000000000000000000000000000000000", {gasLimit: 300000});
    console.log("withdrawn");*/
  } catch(error) {
    console.log(error);
  }
  //WFTM
  /*try {
    const tx1 = await connected.mint("0x0000000000000000000000000000000000000000", 1, {gasLimit: 1000000, value: ethers.utils.parseUnits('1', 'ether')});
  } catch(error) {
    console.log(error);
  }*/
  /*try {
    for(i = 0; i < 38; i++) {
      await connected.mint("0xFb24bC6E1cE0e9f6ceb633FeF2127c2826d8820E", 1, {gasLimit: 1000000/*, value: ethers.utils.parseUnits('1', 'ether')*//*});
    }
  } catch(error) {
    console.log(error);
  }*/
    //console.log(tx2);
  
  //await connected.transferOwnership("0x7D13CD3dCC930BE7fBF1358FaC2617105869DbEc");*/
 
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});

  /*

  // We require the Hardhat Runtime Environment explicitly here. This is optional
  // but useful for running the script in a standalone fashion through `node <script>`.
  //
  // When running the script with `npx hardhat run <script>` you'll find the Hardhat
  // Runtime Environment's members available in the global scope.
  const { BigNumber } = require("@ethersproject/bignumber");
  const hre = require("hardhat");

  async function main() {
    // Hardhat always runs the compile task when running scripts with its command
    // line interface.
    //
    // If this script is run directly using `node` you may want to call compile
    // manually to make sure everything is compiled
    // await hre.run('compile');

    // We get the contract to deploy
    let wei = ethers.utils.parseEther("1000")
    let weiString = wei.toString()
    console.log(weiString)
    const SlurpToken = await hre.ethers.getContractFactory("FKSLURPDEV");
    const slurp = await SlurpToken.deploy("FKSLURPDEV", "SLURP", wei, "0xF1a26c9f2978aB1CA4659d3FbD115845371ED0F5");

    await slurp.deployed();

    console.log("Contract deployed to:", slurp.address);
  }

  // We recommend this pattern to be able to use async/await everywhere
  // and properly handle errors.
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });

  */