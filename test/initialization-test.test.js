/* eslint-disable @typescript-eslint/no-var-requires */
const { ethers, waffle } = require("hardhat");
const hre = require("hardhat");
const { expect } = require("chai");
const { BigNumber } = ethers;
const toWei = ethers.utils.parseEther;
const AddressZero = ethers.constants.AddressZero;

const wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const alphaHomoraAddress = "0x67B66C99D3Eb37Fa76Aa3Ed1ff33E8e39F0b9c7A";
const exchangeWalletAddress = "0xD551234Ae421e3BCBA99A0Da6d736074f22192FF";
const gasLimitConfig = { gasLimit: 9500000 };

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
describe("AlphaHomoraV1ETHLenderYieldSource initialization", async function () {
    const provider = waffle.provider;
    const [wallet, other] = provider.getWallets();
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
    let initializeTxPromise;
    // eslint-disable-next-line no-undef
    before(async function () {
        console.log("wallet.address :>> ", wallet.address);
        console.log("other.address :>> ", other.address);
        // deploy all the pool together.
        const ControlledTokenProxyFactory = await ethers.getContractFactory("ControlledTokenProxyFactory");
        const controlledTokenProxyFactory = await ControlledTokenProxyFactory.deploy(gasLimitConfig);

        const TicketProxyFactory = await ethers.getContractFactory("TicketProxyFactory");
        const ticketProxyFactory = await TicketProxyFactory.deploy(gasLimitConfig);

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
        // mainnet forking / impersonate account
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [exchangeWalletAddress],
        });
        const exchangeWallet = provider.getSigner(exchangeWalletAddress);

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
        initializeTxPromise = await poolWithMultipleWinnersBuilder.createYieldSourceMultipleWinners(
            yieldSourcePrizePoolConfig,
            multipleWinnersConfig,
            decimals,
        );
        const events = await getEvents(poolWithMultipleWinnersBuilder, initializeTxPromise);

        const prizePoolCreatedEvent = events.find(e => e.name == "YieldSourcePrizePoolWithMultipleWinnersCreated");
        prizePool = await ethers.getContractAt(yieldSourcePrizePoolABI, prizePoolCreatedEvent.args.prizePool, wallet);
        prizeStrategy = await ethers.getContractAt(
            multipleWinnersABI,
            prizePoolCreatedEvent.args.prizeStrategy,
            wallet,
        );
    });

    describe("initialization", async () => {
        it("emit YieldSourePrizePoolInitialized event", async function () {
            // expect(await yieldSource.depositToken()).to.eq(weth.address); // this won't work somehow
            await expect(initializeTxPromise)
                .to.emit(prizePool, "YieldSourcePrizePoolInitialized")
                .withArgs(yieldSource.address);
        });

        it("emit YieldSourcePrizePoolWithMultipleWinnersCreated event", async function () {
            // expect(await yieldSource.depositToken()).to.eq(weth.address); // this won't work somehow
            await expect(initializeTxPromise)
                .to.emit(poolWithMultipleWinnersBuilder, "YieldSourcePrizePoolWithMultipleWinnersCreated")
                .withArgs(prizePool.address, prizeStrategy.address);
        });
    });
});
