/* eslint-disable @typescript-eslint/no-var-requires */
const { ethers, waffle } = require("hardhat");
const hre = require("hardhat");
const { expect } = require("chai");
const { AddressZero } = ethers.constants;
const toWei = ethers.utils.parseEther;
const { BigNumber } = require("ethers");

const yieldSourcePrizePoolABI = require("@pooltogether/pooltogether-contracts/abis/YieldSourcePrizePool.json");
const multipleWinnersABI = require("@pooltogether/pooltogether-contracts/abis/MultipleWinners.json");

async function getEvents(contract, tx) {
    let receipt = await ethers.provider.getTransactionReceipt(tx.hash);
    return receipt.logs.reduce((parsedEvents, log) => {
        try {
            parsedEvents.push(contract.interface.parseLog(log));
        } catch (e) {
            console.log("e :>> ", e);
        }
        return parsedEvents;
    }, []);
}

// eslint-disable-next-line no-undef
describe("AlphaHomoraV1ETHLenderYieldSource", function () {
    let weth;
    let wethDecimals;
    let poolWithMultipleWinnersBuilder;
    let factory;
    let prizePool;
    let prizeStrategy;
    let wallet;
    let wallets;
    let yieldSource;
    let alphaHomora;
    let exchangeWallet;
    let rngServiceMock;
    // eslint-disable-next-line no-undef
    before(async function () {
        const exchangeWalletAddress = "0xD551234Ae421e3BCBA99A0Da6d736074f22192FF";
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [exchangeWalletAddress],
        });
        exchangeWallet = await waffle.provider.getSigner(exchangeWalletAddress);
        weth = await ethers.getVerifiedContractAt("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", exchangeWallet);
        alphaHomora = await ethers.getVerifiedContractAt("0x67B66C99D3Eb37Fa76Aa3Ed1ff33E8e39F0b9c7A");
        poolWithMultipleWinnersBuilder = await ethers.getVerifiedContractAt(
            "0xdA64816F76BEA59cde1ecbe5A094F6c56A7F9770",
        );
        wethDecimals = await weth.decimals();
        factory = await ethers.getContractFactory("AlphaHomoraV1ETHLenderYieldSource");
    });

    // eslint-disable-next-line no-undef
    beforeEach(async function () {
        wallets = await ethers.getSigners();
        wallet = wallets[0];
        // setup

        yieldSource = await factory.deploy(alphaHomora.address, weth.address, { gasLimit: 9500000 });
        const yieldSourcePrizePoolConfig = {
            yieldSource: yieldSource.address,
            maxExitFeeMantissa: toWei("0.5"),
            maxTimelockDuration: 1000,
        };
        const RGNFactory = await ethers.getContractFactory("RNGServiceMock");
        rngServiceMock = await RGNFactory.deploy({ gasLimit: 9500000 });
        let decimals = 9;

        const multipleWinnersConfig = {
            proxyAdmin: AddressZero,
            rngService: rngServiceMock.address,
            prizePeriodStart: 0,
            prizePeriodSeconds: 100,
            ticketName: "bankpass",
            ticketSymbol: "bankp",
            sponsorshipName: "banksponso",
            sponsorshipSymbol: "banksp",
            ticketCreditLimitMantissa: toWei("0.1"),
            ticketCreditRateMantissa: toWei("0.1"),
            externalERC20Awards: [],
            numberOfWinners: 1,
        };

        let tx = await poolWithMultipleWinnersBuilder.createYieldSourceMultipleWinners(
            yieldSourcePrizePoolConfig,
            multipleWinnersConfig,
            decimals,
        );
        let events = await getEvents(poolWithMultipleWinnersBuilder, tx);
        let prizePoolCreatedEvent = events.find(e => e.name == "YieldSourcePrizePoolWithMultipleWinnersCreated");

        prizePool = await ethers.getContractAt(yieldSourcePrizePoolABI, prizePoolCreatedEvent.args.prizePool, wallet);
        prizeStrategy = await ethers.getContractAt(
            multipleWinnersABI,
            prizePoolCreatedEvent.args.prizeStrategy,
            wallet,
        );

        // get some weth
        await weth.transfer(wallet.address, BigNumber.from(1000).mul(BigNumber.from(10).pow(wethDecimals)));
    });

    // eslint-disable-next-line no-undef
    it("get token address", async function () {
        expect((await yieldSource.token()) == weth);
    });

    // eslint-disable-next-line no-undef
    it("should be able to get underlying balance", async function () {
        await weth.connect(wallet).approve(prizePool.address, toWei("100"));
        let [token] = await prizePool.tokens();

        await prizePool.depositTo(wallet.address, toWei("100"), token, wallets[1].address);
        expect(await alphaHomora.balanceOf(prizePool.address)) != 0;
    });

    // eslint-disable-next-line no-undef
    it("should be able to withdraw", async function () {
        await weth.connect(wallet).approve(prizePool.address, toWei("100"));
        let [token] = await prizePool.tokens();

        await prizePool.depositTo(wallet.address, toWei("100"), token, wallets[1].address);
        expect(await alphaHomora.balanceOf(prizePool.address)) != 0;

        const balanceBefore = await weth.balanceOf(wallet.address);
        await prizePool.withdrawInstantlyFrom(wallet.address, toWei("1"), token, 1000);
        expect(await alphaHomora.balanceOf(wallet.address)) > balanceBefore;
    });

    // eslint-disable-next-line no-undef
    it("should be able to withdraw all", async function () {
        await weth.connect(wallet).approve(prizePool.address, toWei("100"));
        let [token] = await prizePool.tokens();

        const initialBalance = await weth.balanceOf(wallet.address);

        await prizePool.depositTo(wallet.address, toWei("100"), token, wallets[1].address);

        expect(await alphaHomora.balanceOf(prizePool.address)) != 0;

        hre.network.provider.send("evm_increaseTime", [1000]);

        await expect(prizePool.withdrawInstantlyFrom(wallet.address, toWei("200"), token, 0)).to.be.reverted;

        await prizePool.withdrawInstantlyFrom(wallet.address, toWei("100"), token, 0);

        expect(await weth.balanceOf(wallet.address)) == initialBalance;
    });
});
