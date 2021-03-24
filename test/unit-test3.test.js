/* eslint-disable @typescript-eslint/no-var-requires */
const { ethers, waffle } = require("hardhat");
const hre = require("hardhat");
const { BigNumber } = require("ethers");
const { expect } = require("chai");
const toWei = ethers.utils.parseEther;

const wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const alphaHomoraAddress = "0x67B66C99D3Eb37Fa76Aa3Ed1ff33E8e39F0b9c7A";

// eslint-disable-next-line no-undef
describe("AlphaHomoraV1ETHLenderYieldSource", async function () {
    const provider = waffle.provider;
    const [wallet, other] = provider.getWallets();
    const exchangeWalletAddress = "0xD551234Ae421e3BCBA99A0Da6d736074f22192FF";
    const exchangeWallet = await provider.getSigner(exchangeWalletAddress);

    let weth;
    let alphaHomora;
    let factory;
    let yieldSource;
    let wethFactory;

    // eslint-disable-next-line no-undef
    before(async function () {
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [exchangeWalletAddress],
        });

        alphaHomora = await ethers.getVerifiedContractAt(alphaHomoraAddress); // creat contract instance without manually downloading ABI
        wethFactory = await ethers.getContractFactory("WETH9", exchangeWallet);
        factory = await ethers.getContractFactory("AlphaHomoraV1ETHLenderYieldSource", exchangeWallet);

        console.log("wallet.address :>> ", wallet.address);
        console.log("other.address :>> ", other.address);
    });

    // eslint-disable-next-line no-undef
    beforeEach(async function () {
        weth = await wethFactory.deploy({ gasLimit: 9500000 });

        // const decimals = await weth.decimals();
        await weth.deposit({ value: toWei("100") });
        // await weth.transfer(other.address, BigNumber.from(10).mul(BigNumber.from(10).pow(decimals))); // 10*10**18

        yieldSource = await factory.deploy(alphaHomora.address, weth.address, {
            gasLimit: 9500000,
        });
    });

    // eslint-disable-next-line no-undef
    it("get token address", async function () {
        expect(await yieldSource.depositToken()).to.eq(weth.address);
    });

    it("supplyTokenTo", async function () {
        await weth.approve(yieldSource.address, toWei("100"));
        await yieldSource.supplyTokenTo(toWei("100"), wallet.address);
        expect(await yieldSource.balanceOfToken(wallet.address)).to.eq(toWei("100"));
    });

    // it("supplyTokenTo and redeemToken", async function () {
    //   await weth.approve(yieldSource.address, toWei("100"));
    //   await yieldSource.supplyTokenTo(toWei("100"), wallet.address);
    //   expect(await yieldSource.balanceOfToken(wallet.address)).to.eq(toWei("100"));
    //   await yieldSource.redeemToken(toWei("100"));
    //   expect((await weth.balanceOf(wallet.address)).to.eq(toWei("100")));
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
