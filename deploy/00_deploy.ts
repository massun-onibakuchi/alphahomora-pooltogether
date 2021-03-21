import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("AlphaHomoraV1ETHLenderYieldSource deployed");
  console.log('deployer :>> ', deployer);

  const bankAddress = '0x67B66C99D3Eb37Fa76Aa3Ed1ff33E8e39F0b9c7A'
  const wethAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
  const contract = await deploy('AlphaHomoraV1ETHLenderYieldSource', {
    from: deployer,
    args: [bankAddress, wethAddress],
    log: true,
  });

  console.log("AlphaHomoraV1ETHLenderYieldSource deployed");

  console.log("AlphaHomoraV1ETHLenderYieldSource address:", contract.address);


};

export default func
module.exports.tags = ['AlphaHomoraV1ETHLenderYieldSource']