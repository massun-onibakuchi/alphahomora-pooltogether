/* eslint-disable @typescript-eslint/no-var-requires */
const { ethers, waffle } = require("hardhat");
const hre = require("hardhat");
// const { BigNumber } = require("ethers");
const { expect } = require("chai");
const toWei = ethers.utils.parseEther;
const AddressZero = ethers.constants.AddressZero;

const wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const alphaHomoraAddress = "0x67B66C99D3Eb37Fa76Aa3Ed1ff33E8e39F0b9c7A";
const exchangeWalletAddress = "0xD551234Ae421e3BCBA99A0Da6d736074f22192FF";
const gasLimitConfig = {gasLimit: 20000000};

async function getEvents(contract, tx) {
    let receipt = await ethers.provider.getTransactionReceipt(tx.hash);
    return receipt.logs.reduce((parsedEvents, log) => {
        try {
            parsedEvents.push(contract.interface.parseLog(log));
        } catch (e) {}
        return parsedEvents;
    }, []);
}

// eslint-disable-next-line no-undef
describe("AlphaHomoraV1ETHLenderYieldSource", async function () {
    const provider = waffle.provider;
    const [wallet, other] = provider.getWallets();
    const exchangeWallet = await provider.getSigner(exchangeWalletAddress);

    let weth;
    let alphaHomora;
    let YieldSourceFactory;
    let yieldSource;
    let poolWithMultipleWinnersBuilder;
    let prizePool;
    let prizeStrategy;
    let yieldSourcePrizePoolABI;
    let multipleWinnersABI;
    let rngServiceMock;
    // eslint-disable-next-line no-undef
    before(async function () {
        console.log("wallet.address :>> ", wallet.address);
        console.log("other.address :>> ", other.address);

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [exchangeWalletAddress],
        });

        // deploy all the pool together.
        const TicketProxyFactory = await ethers.getContractFactory("TicketProxyFactory");
        const ticketProxyFactory = await TicketProxyFactory.deploy(gasLimitConfig);

        const ControlledTokenProxyFactory = await ethers.getContractFactory("ControlledTokenProxyFactory");
        const controlledTokenProxyFactory = await ControlledTokenProxyFactory.deploy(gasLimitConfig);

        const ControlledTokenBuilder = await ethers.getContractFactory("ControlledTokenBuilder");
        const controlledTokenBuilder = await ControlledTokenBuilder.deploy(
            ticketProxyFactory.address,
            controlledTokenProxyFactory.address,
            gasLimitConfig,
        );

        const MultipleWinnersProxyFactory = await ethers.getContractFactory("MultipleWinnersProxyFactory");
        const multipleWinnersProxyFactory = await MultipleWinnersProxyFactory.deploy(gasLimitConfig);

        const MultipleWinnersBuilder = await ethers.getContractFactory("MultipleWinnersBuilder");
        const multipleWinnersBuilder = await MultipleWinnersBuilder.deploy(
            multipleWinnersProxyFactory.address,
            controlledTokenBuilder.address,
            gasLimitConfig,
        );

        const StakePrizePoolProxyFactory = await ethers.getContractFactory("StakePrizePoolProxyFactory");
        const stakePrizePoolProxyFactory = await StakePrizePoolProxyFactory.deploy(gasLimitConfig);

        const YieldSourcePrizePoolProxyFactory = await ethers.getContractFactory("YieldSourcePrizePoolProxyFactory");
        const yieldSourcePrizePoolProxyFactory = await YieldSourcePrizePoolProxyFactory.deploy(gasLimitConfig);

        const CompoundPrizePoolProxyFactory = await ethers.getContractFactory("CompoundPrizePoolProxyFactory");
        const compoundPrizePoolProxyFactory = await CompoundPrizePoolProxyFactory.deploy(gasLimitConfig);

        const Registry = await ethers.getContractFactory("Registry");
        const registry = await Registry.deploy(gasLimitConfig);

        const PoolWithMultipleWinnersBuilder = await ethers.getContractFactory("PoolWithMultipleWinnersBuilder");
        poolWithMultipleWinnersBuilder = await PoolWithMultipleWinnersBuilder.deploy(
            registry.address,
            compoundPrizePoolProxyFactory.address,
            yieldSourcePrizePoolProxyFactory.address,
            stakePrizePoolProxyFactory.address,
            multipleWinnersBuilder.address,
            { gasLimit: 9500000 },
        );

        YieldSourceFactory = await ethers.getContractFactory("AlphaHomoraV1ETHLenderYieldSource", exchangeWallet);

        alphaHomora = await ethers.getVerifiedContractAt(alphaHomoraAddress); // creat contract instance without manually downloading ABI
        weth = await ethers.getVerifiedContractAt(wethAddress, exchangeWallet);

        yieldSourcePrizePoolABI = (await hre.artifacts.readArtifact("YieldSourcePrizePool")).abi;
        multipleWinnersABI = (await hre.artifacts.readArtifact("MultipleWinners")).abi;
    });

    // eslint-disable-next-line no-undef
    beforeEach(async function () {
        yieldSource = await YieldSourceFactory.deploy(alphaHomora.address, weth.address, {
            gasLimit: 9500000,
        });
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
            ticketName: "ibETHpass",
            ticketSymbol: "ibETHp",
            sponsorshipName: "ibETHsponso",
            sponsorshipSymbol: "ibETHsp",
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

        await weth.deposit({ value: toWei("100") });
    });

    it("get token address", async function () {
        expect(await yieldSource.depositToken()).to.eq(weth.address);
    });

    it("get underlying balance", async function () {
        await weth.approve(prizePool.address, toWei("100"));
        let [controlledToken] = await prizePool.tokens();
        await prizePool.depositTo(wallet.address, toWei("100"), controlledToken, other);
        expect(await alphaHomora.balanceOf(prizePool.address)) != 0;
    });

    it("supplyTokenTo", async function () {
        await weth.approve(yieldSource.address, toWei("100"));
        await yieldSource.supplyTokenTo(toWei("100"), wallet.address);
        expect(await yieldSource.balanceOfToken(wallet.address)).to.eq(toWei("100"));
    });

    it("should be able to withdraw instantly", async function () {
        await weth.approve(prizePool.address, toWei("100"));
        let [token] = await prizePool.tokens();

        await prizePool.depositTo(wallet.address, toWei("100"), token, other);
        expect(await alphaHomora.balanceOf(prizePool.address)) != 0;

        const balanceBefore = await weth.balanceOf(wallet.address);
        await prizePool.withdrawInstantlyFrom(
            wallet.address,
            toWei("1"),
            token,
            1000, //The maximum exit fee the caller is willing to pay.
        );
        expect(await alphaHomora.balanceOf(wallet.address)) > balanceBefore;
    });

    it("should be able to withdraw all", async function () {
        await weth.connect(wallet).approve(prizePool.address, toWei("100"));
        let [token] = await prizePool.tokens();

        const initialBalance = await weth.balanceOf(wallet.address);

        await prizePool.depositTo(wallet.address, toWei("100"), token, other);

        expect(await alphaHomora.balanceOf(prizePool.address)) != 0;

        await expect(prizePool.withdrawInstantlyFrom(wallet.address, toWei("100"), token, 0)).to.be.reverted;

        hre.network.provider.send("evm_increaseTime", [1000]); // wait max_timelock_duration

        await prizePool.withdrawInstantlyFrom(wallet.address, toWei("100"), token, 0);

        expect(await weth.balanceOf(wallet.address)) == initialBalance;
    });

});
