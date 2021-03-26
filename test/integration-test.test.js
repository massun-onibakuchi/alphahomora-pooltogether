/* eslint-disable @typescript-eslint/no-var-requires */
const { ethers, waffle } = require("hardhat");
const hre = require("hardhat");
const chai = require("chai");
const { expect } = require("chai");
const { BigNumber } = ethers;
const toWei = ethers.utils.parseEther;
const AddressZero = ethers.constants.AddressZero;

chai.use(require("chai-bignumber")());

const wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const alphaHomoraAddress = "0x67B66C99D3Eb37Fa76Aa3Ed1ff33E8e39F0b9c7A";
const exchangeWalletAddress = "0xD551234Ae421e3BCBA99A0Da6d736074f22192FF";
const overrides = { gasLimit: 9500000 };

async function getEvents(contract, tx) {
    const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
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
    const exchangeWallet = provider.getSigner(exchangeWalletAddress);
    let weth;
    let bank;
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
        // deploy all the pool together.
        const ControlledTokenProxyFactory = await ethers.getContractFactory("ControlledTokenProxyFactory");
        const controlledTokenProxyFactory = await ControlledTokenProxyFactory.deploy(overrides);

        const TicketProxyFactory = await ethers.getContractFactory("TicketProxyFactory");
        const ticketProxyFactory = await TicketProxyFactory.deploy(overrides);

        const ControlledTokenBuilder = await ethers.getContractFactory("ControlledTokenBuilder");
        const controlledTokenBuilder = await ControlledTokenBuilder.deploy(
            ticketProxyFactory.address,
            controlledTokenProxyFactory.address,
            overrides,
        );

        const MultipleWinnersProxyFactory = await ethers.getContractFactory("MultipleWinnersProxyFactory");
        const multipleWinnersProxyFactory = await MultipleWinnersProxyFactory.deploy(overrides);

        const MultipleWinnersBuilder = await ethers.getContractFactory("MultipleWinnersBuilder");
        const multipleWinnersBuilder = await MultipleWinnersBuilder.deploy(
            multipleWinnersProxyFactory.address,
            controlledTokenBuilder.address,
            overrides,
        );

        const StakePrizePoolProxyFactory = await ethers.getContractFactory("StakePrizePoolProxyFactory");
        const stakePrizePoolProxyFactory = await StakePrizePoolProxyFactory.deploy(overrides);

        const YieldSourcePrizePoolProxyFactory = await ethers.getContractFactory("YieldSourcePrizePoolProxyFactory");
        const yieldSourcePrizePoolProxyFactory = await YieldSourcePrizePoolProxyFactory.deploy(overrides);

        const CompoundPrizePoolProxyFactory = await ethers.getContractFactory("CompoundPrizePoolProxyFactory");
        const compoundPrizePoolProxyFactory = await CompoundPrizePoolProxyFactory.deploy(overrides);

        const Registry = await ethers.getContractFactory("Registry");
        const registry = await Registry.deploy(overrides);

        const PoolWithMultipleWinnersBuilder = await ethers.getContractFactory("PoolWithMultipleWinnersBuilder");
        poolWithMultipleWinnersBuilder = await PoolWithMultipleWinnersBuilder.deploy(
            registry.address,
            compoundPrizePoolProxyFactory.address,
            yieldSourcePrizePoolProxyFactory.address,
            stakePrizePoolProxyFactory.address,
            multipleWinnersBuilder.address,
            { gasLimit: 9500000 },
        );
        // // mainnet forking / impersonate account
        // await hre.network.provider.request({
        //     method: "hardhat_impersonateAccount",
        //     params: [exchangeWalletAddress],
        // });
        YieldSourceFactory = await ethers.getContractFactory("AlphaHomoraV1ETHLenderYieldSource", other);

        // creat contract instance without manually downloading ABI
        bank = await ethers.getVerifiedContractAt(alphaHomoraAddress);
        weth = await ethers.getVerifiedContractAt(wethAddress, other);

        yieldSourcePrizePoolABI = (await hre.artifacts.readArtifact("YieldSourcePrizePool")).abi;
        multipleWinnersABI = (await hre.artifacts.readArtifact("MultipleWinners")).abi;
    });

    // eslint-disable-next-line no-undef
    beforeEach(async function () {
        yieldSource = await YieldSourceFactory.deploy(bank.address, weth.address, {
            gasLimit: 9500000,
        });
        const yieldSourcePrizePoolConfig = {
            yieldSource: yieldSource.address,
            maxExitFeeMantissa: toWei("0.5"),
            maxTimelockDuration: 1000,
        };
        const RGNFactory = await ethers.getContractFactory("RNGServiceMock");
        rngServiceMock = await RGNFactory.deploy({ gasLimit: 9500000 });

        const decimals = 9;
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
        const tx = await poolWithMultipleWinnersBuilder.createYieldSourceMultipleWinners(
            yieldSourcePrizePoolConfig,
            multipleWinnersConfig,
            decimals,
        );
        const events = await getEvents(poolWithMultipleWinnersBuilder, tx);
        const prizePoolCreatedEvent = events.find(e => e.name == "YieldSourcePrizePoolWithMultipleWinnersCreated");
        if (typeof prizePoolCreatedEvent.args.prizePool != "string")
            throw Error("YieldSourcePrizePoolWithMultipleWinnersCreated", prizePoolCreatedEvent.args);

        prizePool = await ethers.getContractAt(yieldSourcePrizePoolABI, prizePoolCreatedEvent.args.prizePool, wallet);
        prizeStrategy = await ethers.getContractAt(
            multipleWinnersABI,
            prizePoolCreatedEvent.args.prizeStrategy,
            wallet,
        );

        // convert ETH to WETH
        await weth.connect(wallet).deposit({ value: BigNumber.from(100).mul(BigNumber.from(10).pow(18)) });
    });

    // eslint-disable-next-line no-undef
    it("get token address", async function () {
        // expect(await yieldSource.depositToken()).to.eq(weth.address); // this won't work somehow
        expect((await yieldSource.depositToken()) == weth);
    });

    it("should return the underlying balance", async function () {
        await weth.connect(wallet).approve(prizePool.address, toWei("100"));
        const [tokenAddress] = await prizePool.tokens();
        await prizePool.depositTo(wallet.address, toWei("100"), tokenAddress, other.address);
        const balance = await bank.balanceOf(yieldSource.address);
        expect(balance).to.be.bignumber.greaterThan(0);
    });

    it("should be able to withdraw instantly", async function () {
        await weth.connect(wallet).approve(prizePool.address, toWei("100"));
        const [tokenAddress] = await prizePool.tokens();

        await prizePool.depositTo(wallet.address, toWei("100"), tokenAddress, other.address);
        expect(await bank.balanceOf(prizePool.address)) != 0;

        const balanceBefore = await weth.balanceOf(wallet.address);
        await prizePool.withdrawInstantlyFrom(
            wallet.address,
            toWei("1"),
            tokenAddress,
            1000, //The maximum exit fee the caller is willing to pay.
        );
        const balanceAfter = await weth.balanceOf(wallet.address);
        expect(balanceAfter).to.be.bignumber.greaterThan(balanceBefore);
    });
});
