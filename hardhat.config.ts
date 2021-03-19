import 'dotenv/config';
import { task, HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "hardhat-typechain";
import "hardhat-etherscan-abi";

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const BLOCK_NUMBER = process.env.BLOCK_NUMBER;
const PROJECT_ID = "";

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",//rinkeby
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    hardhat: {
      chainId: 1,
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
        blockNumber: parseInt(BLOCK_NUMBER),
        enabled: true
      }
    },
    // rinkeby: {
    // url: "https://rinkeby.infura.io/v3/" + PROJECT_ID,
    // accounts: [privateKey1, privateKey2]
    // accounts: {
    //   mnemonic:"",
    //   path:"",
    //   initialIndex:0,
    //   count:10
    // }
    //https://hardhat.org/config/#hd-wallet-config
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  solidity: {
    compilers: [
      {
        version: "0.7.6",
        settings: {
          "outputSelection": {
            "*": {
              "*": [
                "evm.bytecode.object",
                "evm.deployedBytecode.object",
                "abi",
                "evm.bytecode.sourceMap",
                "evm.deployedBytecode.sourceMap",
                "metadata"
              ],
              // "": [
              //   "ast" // Enable the AST output of every single file.
              // ]
            },
            "def": {
              "*": ["evm.bytecode.object"]
            }
          },
          optimizer: {
            enabled: true,
            runs: 200
          }
        },
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

export default config;
