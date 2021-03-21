import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("SampleToken deployed");
  console.log('deployer :>> ', deployer);

  const name = 'BasicToekn'
  const symbol = 'BAS'
  const contract = await deploy('SampleToken', {
    from: deployer,
    args: [name, symbol],
    log: true,
  });

  console.log("SampleToken deployed");

  console.log("SampleToken address:", contract.address);


};

export default func
module.exports.tags = ['SampleToken']