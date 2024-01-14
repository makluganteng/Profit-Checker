import { BigNumber, ethers, utils } from "ethers";
import ERC20TokenABI from "../../public/abi/ERC20.json";
import UniswapABI from "../../public/abi/UniswapV2.json";
import UniswapABI2 from "../../public/abi/UniswapV2-01.json";
import {
  TransactionLogRaw,
  TransactionLogWithDecodedEvent,
} from "./transaction.types";
import axios from "axios";

const provider = new ethers.providers.JsonRpcProvider(
  //   "https://rpc.sepolia.org"
  //   "https://mainnet.infura.io/v3/"
  `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_API_KEY}`
);

const ERC20TokenEventsABIInterface = new utils.Interface(ERC20TokenABI.abi);
const UniswapABIInterface = new utils.Interface(UniswapABI);
const UniswapABIInterface2 = new utils.Interface(UniswapABI2);

const contractInterfaces = [
  ERC20TokenEventsABIInterface,
  // ERC721TokenEventsABIInterface,
  UniswapABIInterface,
  UniswapABIInterface2,
];

export const getTransaction = async (transactionHash: string) => {
  const transaction = await provider.getTransactionReceipt(transactionHash);
  return transaction;
};

export const formatHex = (hex: BigNumber) => {
  const gasUsedBigNumber = ethers.BigNumber.from(hex);

  // Convert BigNumber to a readable number (string)
  const gasUsedNumber = gasUsedBigNumber.toString();

  return gasUsedNumber;
};

export const formatTokenAmount = (amount: BigNumber, decimals: number) => {
  const amountBigNumber = ethers.BigNumber.from(amount);

  // Convert BigNumber to a readable number (string)
  const amountNumber = amountBigNumber.toString();

  // Convert number to a readable amount
  const amountFormatted = ethers.utils.formatUnits(amountNumber, decimals);

  return amountFormatted;
};

export const identifyTransactionType = (transactionReceipt: any) => {
  if (transactionReceipt.to === null) {
    return "Contract Creation";
  } else if (transactionReceipt.contractAddress === null) {
    return "Transfer";
  } else {
    return "Contract Interaction";
  }
};

export const checkUniswapTransaction = (transactionReceipt: any) => {
  if (transactionReceipt.to === "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD") {
    //this is a Uniswap transaction
    //step 1 check the logs
    transactionReceipt.logs.forEach((log: any) => {
      if (log.data.length === 66) {
        const decodedLog = ethers.utils.defaultAbiCoder.decode(
          ["uint256"],
          log.data
        );
        console.log(formatHex(decodedLog[0]));
      }
    });
    //step 2 check the contract address
  }
};

export const decodeTransactionLogs = (
  logs: TransactionLogRaw[]
): TransactionLogWithDecodedEvent[] => {
  try {
    return logs
      .map((log) => {
        const decodedEvent = decodeLogWithInterface(log);
        return {
          ...log,
          decodedEvent,
        };
      })
      .filter((log) => !!log.decodedEvent);
  } catch (error) {
    return [];
  }
};

const decodeLogWithInterface = (
  log: TransactionLogRaw
): utils.LogDescription | undefined => {
  for (const contractInterface of contractInterfaces) {
    try {
      const decodedEvent = contractInterface.parseLog(log);
      if (decodedEvent) {
        return decodedEvent;
      }
    } catch (err) {}
  }
  return undefined;
};

export const getCurrentPrice = async (
  contractAddress: string
): Promise<string> => {
  // const blockTimestamp = (await provider.getBlock(blockNumber)).timestamp;
  // const date = new Date(blockTimestamp * 1000);
  // const day = date.getDate();

  //call coingecko api
  try {
    const getPrice = await axios.get(
      `https://api.coingecko.com/api/v3/coins/1/contract/${contractAddress}`
    );
    const price = getPrice.data.market_data.current_price.usd;

    return price.toString();
  } catch (error) {
    return "0";
  }
};
