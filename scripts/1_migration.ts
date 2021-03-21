import { run, ethers } from "hardhat";

async function main() {
    const accounts = await ethers.getSigners();
    console.log("Accounts:", accounts.map(a => a.address));

    const bankAddress = '0x67B66C99D3Eb37Fa76Aa3Ed1ff33E8e39F0b9c7A'

    const WETH = await ethers.getContractFactory("WETH9");
    const weth = await WETH.deploy();
    await weth.deployed();

    const YieldSource = await ethers.getContractFactory("AlphaHomoraV1ETHLenderYieldSource");
    const yieldSource = await YieldSource.deploy(bankAddress, weth.address);
    await yieldSource.deployed();


    console.log('yieldSource.address :>> ', yieldSource.address);
    console.log('weth.address :>> ', weth.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });