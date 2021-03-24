/* eslint-disable @typescript-eslint/no-var-requires */
const { ethers, waffle } = require("hardhat");
const hre = require("hardhat");
const { BigNumber } = require("ethers");
const { expect } = require("chai");
const toWei = ethers.utils.parseEther;

const wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const alphaHomoraAddress = "0x67B66C99D3Eb37Fa76Aa3Ed1ff33E8e39F0b9c7A";

describe("AlphaHomoraV1ETHLenderYieldSource", function () {
    let weth;
    let alphaHomora;
    let wallet;
    let other;
    let wallets;
    let exchangeWallet;
    let factory;
    let yieldSource;
    let wethFactory;

    before(async function () {
        wallets = await ethers.getSigners();
        [wallet, other] = wallets;

        const exchangeWalletAddress = "0xD551234Ae421e3BCBA99A0Da6d736074f22192FF";
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [exchangeWalletAddress],
        });

        exchangeWallet = await waffle.provider.getSigner(exchangeWalletAddress);

        wethFactory = await ethers.getContractFactory("WETH9", exchangeWallet);
        // weth = await ethers.getVerifiedContractAt(
        //   wethAddress,
        //   exchangeWallet
        // );

        alphaHomora = await ethers.getVerifiedContractAt(alphaHomoraAddress);

        // const wethDecimals = await weth.decimals();
        const wethDecimals = 18;

        // console.log('weth.address :>> ', weth.address);
        // console.log('await weth.totalSupply() :>> ', await weth.totalSupply());
        // console.log('alphaHomora.address :>> ', alphaHomora.address);

        // XXX
        // await weth.deposit();

        // await weth.transfer(
        //   wallet.address,
        //   BigNumber.from(10000).mul(BigNumber.from(10).pow(wethDecimals))
        // );

        // factory = await ethers.getContractFactory(
        //   "AlphaHomoraV1ETHLenderYieldSource",
        //   // wethAddress,
        //   // alphaHomoraAddress
        // );
    });

    beforeEach(async function () {
        // wallets = await ethers.getSigners();
        // wallet = wallets[0];
        const ethAmount = 100;
        console.log("hogeho");
        weth = await wethFactory.deploy({ gasLimit: 9500000 });

        const wethDecimals = 18;
        console.log("wallet.balance :>> ", wallet.balance);
        await weth.deposit({ value: ethAmount });

        await weth.transfer(other.address, BigNumber.from(10).mul(BigNumber.from(10).pow(wethDecimals)));

        yieldSource = await factory.deploy(alphaHomora.address, weth.address, {
            gasLimit: 9500000,
        });
    });

    it("get token address", async function () {
        expect((await yieldSource.depositToken()) == weth);
    });

    // it("supplyTokenTo and redeemToken", async function () {
    //   await weth.connect(wallet).approve(yieldSource.address, toWei("100"));
    //   await yieldSource.supplyTokenTo(toWei("100"), wallet.address);
    //   expect(await yieldSource.balanceOfToken(wallet.address)) == toWei("100");
    //   await yieldSource.redeemToken(toWei("100"));
    //   expect((await weth.balanceOf(wallet.address)) == toWei("10000"));
    // });

    // it("prevent funds from being taken by unauthorized", async function () {
    //   await weth.connect(wallet).approve(yieldSource.address, toWei("100"));
    //   await yieldSource.supplyTokenTo(toWei("100"), wallet.address);

    //   await expect(
    //     yieldSource.connect(wallets[1]).redeemToken(toWei("100"))
    //   ).to.be.revertedWith("SafeMath: subtraction overflow");
    // });

    // it("is not affected by token transfered by accident", async function () {
    //   await weth.connect(wallet).transfer(yieldSource.address, toWei("100"));

    //   expect(await yieldSource.balanceOfToken(wallet.address)) == 0;
    // });
});
