import { ethers, waffle } from "hardhat";
import hre from "hardhat";
import { expect } from "chai";
const { AddressZero } = ethers.constants;

const toWei = ethers.utils.parseEther;
// import { BigNumber } from "ethers";
const BigNumber = ethers.BigNumber;

import yieldSourcePrizePoolABI from "@pooltogether/pooltogether-contracts/abis/YieldSourcePrizePool.json";
import multipleWinnersABI from "@pooltogether/pooltogether-contracts/abis/MultipleWinners.json";

async function getEvents(contract, tx) {
  const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
  return receipt.logs.reduce((parsedEvents, log) => {
    try {
      parsedEvents.push(contract.interface.parseLog(log));
    } catch (e) { }
    return parsedEvents;
  }, []);
}

describe("SushiYieldSource", function () {
  let sushi;
  let sushiDecimals;
  let poolWithMultipleWinnersBuilder;
  let factory;
  let prizePool;
  let prizeStrategy;
  let wallet;
  let wallets;
  let yieldSource;
  let sushiBar;
  let exchangeWallet;
  before(async function () {
    const exchangeWalletAddress = "0xD551234Ae421e3BCBA99A0Da6d736074f22192FF";
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [exchangeWalletAddress],
    });
    exchangeWallet = waffle.provider.getSigner(exchangeWalletAddress);
    sushi = await hre.ethers.getVerifiedContractAt(
      "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2",
      exchangeWallet
    );
    sushiBar = await hre.ethers.getVerifiedContractAt(
      "0x8798249c2E607446EfB7Ad49eC89dD1865Ff4272"
    );
    poolWithMultipleWinnersBuilder = await hre.ethers.getVerifiedContractAt(
      "0xdA64816F76BEA59cde1ecbe5A094F6c56A7F9770"
    );
    sushiDecimals = await sushi.decimals();
    factory = await ethers.getContractFactory("SushiYieldSource");
  });

  beforeEach(async function () {
    wallets = await ethers.getSigners();
    wallet = wallets[0];
    // setup

    yieldSource = await factory.deploy({ gasLimit: 9500000 });
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
      ticketName: "sushipass",
      ticketSymbol: "suship",
      sponsorshipName: "sushisponso",
      sponsorshipSymbol: "sushisp",
      ticketCreditLimitMantissa: toWei("0.1"),
      ticketCreditRateMantissa: toWei("0.1"),
      externalERC20Awards: [],
      numberOfWinners: 1,
    };

    let tx = await poolWithMultipleWinnersBuilder.createYieldSourceMultipleWinners(
      yieldSourcePrizePoolConfig,
      multipleWinnersConfig,
      decimals
    );
    let events = await getEvents(poolWithMultipleWinnersBuilder, tx);
    let prizePoolCreatedEvent = events.find(
      (e) => e.name == "YieldSourcePrizePoolWithMultipleWinnersCreated"
    );

    prizePool = await ethers.getContractAt(
      yieldSourcePrizePoolABI,
      prizePoolCreatedEvent.args.prizePool,
      wallet
    );
    prizeStrategy = await ethers.getContractAt(
      multipleWinnersABI,
      prizePoolCreatedEvent.args.prizeStrategy,
      wallet
    );

    // get some sushi
    await sushi.transfer(
      wallet.address,
      BigNumber.from(1000).mul(BigNumber.from(10).pow(sushiDecimals))
    );
  });

  it("get token address", async function () {
    expect((await yieldSource.token()) == sushi);
  });

  it("should be able to get underlying balance", async function () {
    await sushi.connect(wallet).approve(prizePool.address, toWei("100"));
    let [token] = await prizePool.tokens();

    await prizePool.depositTo(
      wallet.address,
      toWei("100"),
      token,
      wallets[1].address
    );
    expect(await sushiBar.balanceOf(prizePool.address)) != 0;
  });

  it("should be able to withdraw", async function () {
    await sushi.connect(wallet).approve(prizePool.address, toWei("100"));
    let [token] = await prizePool.tokens();

    await prizePool.depositTo(
      wallet.address,
      toWei("100"),
      token,
      wallets[1].address
    );
    expect(await sushiBar.balanceOf(prizePool.address)) != 0;

    const balanceBefore = await sushi.balanceOf(wallet.address);
    await prizePool.withdrawInstantlyFrom(
      wallet.address,
      toWei("1"),
      token,
      1000
    );
    expect(await sushiBar.balanceOf(wallet.address)) > balanceBefore;
  });

  it("should be able to withdraw all", async function () {
    await sushi.connect(wallet).approve(prizePool.address, toWei("100"));
    let [token] = await prizePool.tokens();

    const initialBalance = await sushi.balanceOf(wallet.address);

    await prizePool.depositTo(
      wallet.address,
      toWei("100"),
      token,
      wallets[1].address
    );

    expect(await sushiBar.balanceOf(prizePool.address)) != 0;

    hre.network.provider.send("evm_increaseTime", [1000]);

    await expect(
      prizePool.withdrawInstantlyFrom(wallet.address, toWei("200"), token, 0)
    ).to.be.reverted;

    await prizePool.withdrawInstantlyFrom(
      wallet.address,
      toWei("100"),
      token,
      0
    );

    expect(await sushi.balanceOf(wallet.address)) == initialBalance;
  });
});