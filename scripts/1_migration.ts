import { run, ethers } from "hardhat";

async function main() {
    const accounts = await ethers.getSigners();
    console.log("Accounts:", accounts.map(a => a.address));

    const YieldSource = await ethers.getContractFactory("AlphaHomoraV1ETHLenderYieldSource");
    const yieldSource = await YieldSource.deploy();
    await yieldSource.deployed();

    const WETH = await ethers.getContractFactory("WETH9");
    const weth = await WETH.deploy();
    await weth.deployed();

    console.log('yieldSource.address :>> ', yieldSource.address);
    console.log('weth.address :>> ', weth.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });