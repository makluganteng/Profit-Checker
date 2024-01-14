import Image from "next/image";
import { Inter } from "next/font/google";
import { Button, Input } from "@chakra-ui/react";
import {
  checkUniswapTransaction,
  decodeTransactionLogs,
  formatHex,
  formatTokenAmount,
  getCurrentPrice,
  getTransaction,
  identifyTransactionType,
} from "@/utils/helper";
import { useEffect, useState } from "react";
import { TransactionLogWithDecodedEvent } from "@/utils/transaction.types";

const inter = Inter({ subsets: ["latin"] });

interface TokenPrices {
  [address: string]: string;
}

export default function Home() {
  const [transactionHash, setTransactionHash] = useState<string>("");
  const [transactionReceipt, setTransactionReceipt] = useState<any>(null);
  const [transactionType, setTransactionType] = useState<string>("");
  const [arrayOfTransactions, setArrayOfTransactions] = useState<any[]>([]);
  const [transactionLogs, setTransactionLogs] = useState<
    TransactionLogWithDecodedEvent[]
  >([]);
  const [tokenPrices, setTokenPrices] = useState<TokenPrices>({});

  useEffect(() => {
    const fetchPrices = async () => {
      const prices: TokenPrices = {};

      for (const log of transactionLogs) {
        if (log.decodedEvent?.eventFragment.name === "Transfer") {
          const price = await getCurrentPrice(log.address);
          if (price) {
            prices[log.address] = price.toString();
          }
        }
      }

      setTokenPrices(prices);
    };

    fetchPrices();
  }, [transactionLogs]);

  const handleSubmit = async () => {
    try {
      const transactionReceipt = await getTransaction(transactionHash);
      console.log(transactionReceipt);
      const transactionTypeResult = identifyTransactionType(transactionReceipt);
      checkUniswapTransaction(transactionReceipt);
      const result = decodeTransactionLogs(transactionReceipt.logs);
      setTransactionLogs(result);
      setTransactionType(transactionTypeResult);
      setArrayOfTransactions([
        ...arrayOfTransactions,
        { type: transactionType, transaction: transactionReceipt },
      ]);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-2">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-gray-800">
          Transaction Hash Profit Checker
        </h1>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-medium text-gray-700">
          Step 1: Input your transaction hash
        </h2>
        <div className="mt-4 flex justify-center items-center">
          <input
            type="text"
            onChange={(e) => setTransactionHash(e.target.value)}
            className="form-input mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
          <button
            onClick={handleSubmit}
            className="ml-4 px-6 py-2 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
          >
            Submit
          </button>
        </div>
      </div>

      {arrayOfTransactions.map((transaction, index) => {
        return (
          <div
            key={index}
            className="mt-8 p-6 bg-white rounded-lg shadow-md border border-gray-200"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Transaction Details
            </h2>
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">
                Transaction Result
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>
                  <span className="font-medium">Type of transaction:</span>{" "}
                  {transactionType}
                </li>
                <li>
                  <span className="font-medium">To:</span>{" "}
                  {transaction.transaction.to
                    ? transaction.transaction.to
                    : "null"}
                </li>
                <li>
                  <span className="font-medium">From:</span>{" "}
                  {transaction.transaction.from}
                </li>
                <li>
                  <span className="font-medium">Contract Address:</span>{" "}
                  {transaction.transaction.contractAddress
                    ? transaction.transaction.contractAddress
                    : "null"}
                </li>
                <li>
                  <span className="font-medium">Gas used:</span>{" "}
                  {formatHex(transaction.transaction.gasUsed)} Wei
                </li>
                {transactionLogs.map((log, index) => {
                  if (
                    log.decodedEvent?.eventFragment.name === "Transfer" &&
                    tokenPrices[log.address]
                  ) {
                    return (
                      <li
                        key={index}
                        className="flex flex-col mt-2 bg-gray-100 p-3 rounded-md shadow"
                      >
                        <span className="font-medium text-gray-700">
                          Token Address:
                        </span>
                        <span className="text-blue-600 break-all">
                          {log.address}
                        </span>
                        <span className="font-medium text-gray-700 mt-2">
                          Amount :{" "}
                          {formatTokenAmount(log.decodedEvent?.args[2], 18)}
                        </span>
                        <span className="font-medium text-gray-700 mt-2">
                          Token Price:
                        </span>
                        <span className="text-green-600">
                          {/* {(
                            Number.parseInt(tokenPrices[log.address]) *
                            Number.parseInt(
                              formatTokenAmount(log.decodedEvent?.args[2], 18)
                            )
                          ).toString()}{" "} */}
                          {tokenPrices[log.address]}
                          USD
                        </span>
                      </li>
                    );
                  }
                })}
              </ul>
            </div>

            <br />
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Transaction Logs
                </h3>
              </div>
              <div className="border-t border-gray-200">
                {transactionLogs.map((log, index) => (
                  <div
                    key={index}
                    className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
                  >
                    <div className="text-sm font-medium text-gray-500 sm:col-span-1">
                      {log.decodedEvent?.name}
                    </div>
                    <div className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <p>Event: {log.decodedEvent?.signature}</p>
                      <div>
                        {log.decodedEvent?.eventFragment.inputs.map(
                          (input, idx) => {
                            const isUint = input.type.includes("uint");
                            const value = isUint
                              ? formatHex(log.decodedEvent?.args[idx])
                              : log.decodedEvent?.args[idx].toString();

                            return (
                              <div key={idx} className="mt-2">
                                <p className="text-gray-600">
                                  <span className="font-medium">
                                    {input.name}:
                                  </span>{" "}
                                  {value}
                                </p>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
