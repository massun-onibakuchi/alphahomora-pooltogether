import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.time("AlphaHomoraV1ETHLenderYieldSource deployed");

  const contract = await deploy('AlphaHomoraV1ETHLenderYieldSource', {
    from: deployer,
    args: [],
    log: true,
  });

  console.timeEnd("AlphaHomoraV1ETHLenderYieldSource deployed");

  console.log("AlphaHomoraV1ETHLenderYieldSource address:", contract.address);


};

export default func
module.exports.tags = ['AlphaHomoraV1ETHLenderYieldSource']