declare global {
  interface Window {
    Jupiter: any;
  }
}

import { BN, Program } from "@coral-xyz/anchor";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { CNftSolPostMintMetaType } from "@itheum/sdk-mx-data-nft/out";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { SPL_ACCOUNT_COMPRESSION_PROGRAM_ID } from "@solana/spl-account-compression";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { NATIVE_MINT } from "@solana/spl-token";
import { AccountMeta, Connection, PublicKey, Transaction, TransactionConfirmationStrategy, Commitment, ComputeBudgetProgram } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { SOL_ENV_ENUM } from "libs/config";
import { backendApi, getApiDataDex, getApiDataMarshal } from "libs/utils";
import { BOND_CONFIG_INDEX, BONDING_PROGRAM_ID } from "./config";
import { CoreSolBondStakeSc, IDL } from "./CoreSolBondStakeSc";
import { Bond, PriorityFeeConfig } from "./types";

enum RewardsState {
  Inactive = 0,
  Active = 1,
}

export const MAX_PERCENT = 10000;
export const SLOTS_IN_YEAR = 78840000; // solana slots in a year; Approx. 0.4 seconds per  slot
export const ITHEUM_SOL_TOKEN_ADDRESS = import.meta.env.VITE_ENV_ITHEUM_SOL_TOKEN_ADDRESS;
export const DIVISION_SAFETY_CONST = 10 ** 9;

const priorityFeeConfig = {
  enabled: process.env.SOL_PRIORITY_FEE_ENABLE || "",
  rate: process.env.SOL_PRIORITY_FEE_RATE || "",
};

const _SOL_PRIORITY_FEE_COMPUTE_UNITS_TX_INITADDR = process.env.SOL_PRIORITY_FEE_COMPUTE_UNITS_TX_INITADDR || "";
const _SOL_PRIORITY_FEE_COMPUTE_UNITS_TX_BOND = process.env.SOL_PRIORITY_FEE_COMPUTE_UNITS_TX_BOND || "";

export async function fetchSolNfts(solAddress: string | undefined) {
  if (!solAddress) {
    return [];
  } else {
    // const resp = await fetch(`${getApiDataDex()}/bespoke/sol/getDataNFTsByOwner?publicKeyb58=${solAddress}`);
    const resp = await fetch(`${backendApi()}/solana/getDataNFTsByOwner?owner=${solAddress}`);
    const data = await resp.json();

    return data.nfts;
  }
}

function bufferToArray(buffer: Buffer): number[] {
  const nums: number[] = [];
  for (let i = 0; i < buffer.length; i++) {
    nums.push(buffer[i]);
  }
  return nums;
}

function decode(stuff: string) {
  return bufferToArray(bs58.decode(stuff));
}

const mapProof = (proof: string[]): AccountMeta[] => {
  return proof.map((node) => ({
    pubkey: new PublicKey(node),
    isSigner: false,
    isWritable: false,
  }));
};

function calculateRewardsSinceLastAllocation(currentSlot: BN, rewardsConfig: any): BN {
  if (rewardsConfig.rewardsState === RewardsState.Inactive) {
    return new BN(0);
  }

  if (currentSlot.lte(rewardsConfig.lastRewardSlot)) {
    return new BN(0);
  }

  const slotDiff = currentSlot.sub(rewardsConfig.lastRewardSlot);
  return rewardsConfig.rewardsPerSlot.mul(slotDiff);
}

function getAmountAprBounded(maxApr: BN, amount: BN): BN {
  return amount.mul(maxApr).div(new BN(MAX_PERCENT)).div(new BN(SLOTS_IN_YEAR));
}

// Fetch the bonding data config from the Solana Program
export async function fetchBondingConfigSol(programSol: any) {
  try {
    const bondConfigPda = PublicKey.findProgramAddressSync([Buffer.from("bond_config"), Buffer.from([1])], programSol.programId)[0];

    const res = await programSol?.account.bondConfig.fetch(bondConfigPda);

    return {
      bondConfigPda: bondConfigPda,
      lockPeriod: res.lockPeriod.toNumber(),
      bondAmount: new BigNumber(res.bondAmount).dividedBy(10 ** 9),
      withdrawPenalty: res.withdrawPenalty.toNumber() / 100,
      bondState: res.bondState,
      merkleTree: res.merkleTree,
    };
  } catch (error) {
    // console.error("fetchBondingConfigError", error);
    return {
      error: true,
    };
  }
}

// Fetch the rewards data config from the Solana Program
export async function fetchRewardsConfigSol(programSol: any) {
  try {
    const _rewardsConfigPda = PublicKey.findProgramAddressSync([Buffer.from("rewards_config")], programSol.programId)[0];
    const res = await programSol?.account.rewardsConfig.fetch(_rewardsConfigPda);

    return {
      rewardsConfigPda: _rewardsConfigPda,
      accumulatedRewards: new BigNumber(res.accumulatedRewards).dividedBy(10 ** 9),
      globalRewardsPerBlock: new BigNumber(res.rewardsPerSlot).dividedBy(10 ** 9),
      rewardsState: res.rewardsState,
      rewardsPerShare: new BigNumber(res.rewardsPerShare).dividedBy(10 ** 9),
      lastRewardSlot: res.lastRewardSlot.toNumber(),
      rewardsReserve: new BigNumber(res.rewardsReserve).dividedBy(10 ** 9),
      maxApr: res.maxApr.toNumber() / 100,
    };
  } catch (error) {
    // console.error("fetchRewardsConfigError", error);
    return {
      error: true,
    };
  }
}

export function computeAddressClaimableAmount(
  currentSlot: BN,
  rewardsConfig: any,
  addressRewardsPerShare: BN,
  addressTotalBondAmount: BN,
  globalTotalBond: BN
) {
  const newRewardsConfig = generateAggregatedRewards(currentSlot, rewardsConfig, globalTotalBond);
  const addressClaimableRewards = calculateAddressShareInRewards(
    newRewardsConfig.accumulatedRewards,
    newRewardsConfig.rewardsPerShare,
    addressTotalBondAmount,
    addressRewardsPerShare,
    globalTotalBond
  );

  return addressClaimableRewards.toNumber();
}

function generateAggregatedRewards(currentSlot: BN, rewardsConfig: any, totalBondAmount: BN): any {
  const lastRewardSlot: BN = rewardsConfig.lastRewardSlot;
  let _newRewardsConfig = {};
  const extraRewardsUnbounded = calculateRewardsSinceLastAllocation(currentSlot, rewardsConfig);
  const maxApr = rewardsConfig.maxApr;
  let extraRewards: BN;

  if (maxApr.gt(new BN(0))) {
    const extraRewardsAprBondedPerSlot = getAmountAprBounded(rewardsConfig.maxApr, totalBondAmount);
    const slotDiff = currentSlot.sub(lastRewardSlot);
    const extraRewardsAprBonded = extraRewardsAprBondedPerSlot.mul(slotDiff);
    extraRewards = BN.min(extraRewardsUnbounded, extraRewardsAprBonded);
  } else {
    extraRewards = extraRewardsUnbounded;
  }
  if (extraRewards.gt(new BN(0)) && extraRewards.lte(rewardsConfig.rewardsReserve)) {
    const increment = extraRewards.mul(new BN(DIVISION_SAFETY_CONST)).div(totalBondAmount);
    _newRewardsConfig = {
      ...rewardsConfig,
      rewardsPerShare: rewardsConfig.rewardsPerShare.add(increment),
      rewardsReserve: rewardsConfig.rewardsReserve.sub(extraRewards),
      accumulatedRewards: rewardsConfig.accumulatedRewards.add(extraRewards),
    };
  } else {
    _newRewardsConfig = rewardsConfig;
  }

  return _newRewardsConfig;
}

function calculateAddressShareInRewards(
  accumulatedRewards: BN,
  rewardsPerShare: BN,
  addressBondAmount: BN,
  addressRewardsPerShare: BN,
  totalBondAmount: BN
): BN {
  // If no total bond or rewards, return 0
  if (totalBondAmount.isZero() || accumulatedRewards.isZero()) {
    return new BN(0);
  }
  // Calculate the difference between rewards per share and the user's rewards per share
  const diff: BN = rewardsPerShare.sub(addressRewardsPerShare);
  // Calculate the address's rewards
  const addressRewards = addressBondAmount.mul(diff).div(new BN(DIVISION_SAFETY_CONST));

  return addressRewards;
}

export async function createBondTransaction(
  mintMeta: CNftSolPostMintMetaType,
  userPublicKey: PublicKey,
  connection: Connection,
  skipDeepParse?: boolean
): Promise<{ error: boolean; errorMsg?: string; transaction?: Transaction; bondId?: number; nonce?: number }> {
  try {
    const mintMetaJSON = skipDeepParse ? mintMeta : JSON.parse(mintMeta.toString());
    const {
      assetId,
      leafSchema: { dataHash, creatorHash, nonce },
      proof: { proof, root },
    } = mintMetaJSON;

    const proofPathAsAccounts = mapProof(proof);
    const programId = new PublicKey(BONDING_PROGRAM_ID);
    const program = new Program<CoreSolBondStakeSc>(IDL, programId, {
      connection,
    });

    const proofRoot = decode(root);

    // note that we do the below string check, as dataHash and creatorHash come from the backend in various formats depending on the RPC being uses
    // ... i.e. during mint and bond direct, we get the values from the mint tx signature, where as for delayed bonding we get it from getAssetProof RPC
    // ... and they both return it in different formats
    const _dataHash = typeof dataHash === "string" ? Array.from(bs58.decode(dataHash)) : Object.values(dataHash).map(Number);
    const _creatorHash = typeof creatorHash === "string" ? Array.from(bs58.decode(creatorHash)) : Object.values(creatorHash).map(Number);

    const rewardsConfigPda = PublicKey.findProgramAddressSync([Buffer.from("rewards_config")], program.programId)[0];
    const addressBondsRewardsPda = PublicKey.findProgramAddressSync([Buffer.from("address_bonds_rewards"), userPublicKey.toBuffer()], program.programId)[0];

    const bondId = await program.account.addressBondsRewards.fetch(addressBondsRewardsPda).then((data: any) => {
      const _bondId = data.currentIndex + 1;
      return _bondId;
    });

    const bondPda = PublicKey.findProgramAddressSync([Buffer.from("bond"), userPublicKey.toBuffer(), new BN(bondId).toBuffer("le", 2)], program.programId)[0];
    const assetUsagePda = PublicKey.findProgramAddressSync([new PublicKey(assetId).toBuffer()], program.programId)[0];
    const vaultConfigPda = PublicKey.findProgramAddressSync([Buffer.from("vault_config")], programId)[0];
    const vaultAta = await getAssociatedTokenAddress(new PublicKey(ITHEUM_SOL_TOKEN_ADDRESS), vaultConfigPda, true);
    const userItheumAta = await getAssociatedTokenAddress(new PublicKey(ITHEUM_SOL_TOKEN_ADDRESS), userPublicKey, true);

    const bondConfigPda = PublicKey.findProgramAddressSync([Buffer.from("bond_config"), Buffer.from([BOND_CONFIG_INDEX])], program.programId)[0];
    const bondConfigData = await program.account.bondConfig.fetch(bondConfigPda).then((data: any) => {
      const bondAmount = data.bondAmount;
      const merkleTree = data.merkleTree;
      return { amount: bondAmount, merkleTree: merkleTree };
    });

    // Create the transaction using bond method from program
    const baseTransactionBond: Transaction = await program.methods
      .bond(BOND_CONFIG_INDEX, bondId, bondConfigData.amount, new BN(nonce), proofRoot, _dataHash, _creatorHash)
      .accounts({
        addressBondsRewards: addressBondsRewardsPda,
        assetUsage: assetUsagePda,
        bond: bondPda,
        bondConfig: bondConfigPda,
        rewardsConfig: rewardsConfigPda,
        vaultConfig: vaultConfigPda,
        vault: vaultAta,
        mintOfTokenSent: new PublicKey(ITHEUM_SOL_TOKEN_ADDRESS),
        authority: userPublicKey,
        merkleTree: bondConfigData.merkleTree,
        authorityTokenAccount: userItheumAta,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
      })
      .remainingAccounts(proofPathAsAccounts)
      .transaction(); // Creates the unsigned transaction

    const wrappedTransaction = await wrapTransactionWithPriorityFee(
      "bondTx",
      baseTransactionBond,
      priorityFeeConfig as PriorityFeeConfig,
      _SOL_PRIORITY_FEE_COMPUTE_UNITS_TX_BOND,
      connection
    );

    return {
      transaction: wrappedTransaction,
      bondId,
      nonce,
      error: false,
    };
  } catch (error: any) {
    console.error("Transaction creation failed:", error);
    return {
      error: true,
      errorMsg: error.toString(),
    };
  }
}

/**
 * Gets recommended priority fee from RPC
 * @param connection - Solana connection
 * @returns recommended fee in microLamports
 */
export async function getRecommendedPriorityFee(connection: Connection): Promise<{ medianFee: number; lowFee: number; highFee: number }> {
  try {
    // Get fees from last 20 slots
    const priorityFees = await connection.getRecentPrioritizationFees();

    if (priorityFees.length === 0) {
      return {
        medianFee: 0,
        lowFee: 0,
        highFee: 0,
      };
    }

    console.log("priorityFees", priorityFees);

    // Calculate median fee from recent fees (Using the median helps avoid being influenced by outlier transactions (very high or very low fees)
    const sortedFees = priorityFees.sort((a, b) => a.prioritizationFee - b.prioritizationFee);
    const medianFee = sortedFees[Math.floor(sortedFees.length / 2)].prioritizationFee;

    return {
      lowFee: sortedFees[0].prioritizationFee,
      highFee: sortedFees[sortedFees.length - 1].prioritizationFee,
      medianFee,
    };
  } catch (error) {
    console.error("Failed to get recommended priority fee:", error);
    return {
      medianFee: 0,
      lowFee: 0,
      highFee: 0,
    };
  }
}

/**
 * Wraps a transaction with priority fees if enabled in environment configuration
 * @param txIs - The tx identifier of the  transaction being wrapped
 * @param baseTx - The base transaction to potentially wrap with priority fees
 * @param config - Priority fee configuration
 * @returns Transaction with or without priority fees
 */
export async function wrapTransactionWithPriorityFee(
  txIs: string,
  baseTx: Transaction,
  config: PriorityFeeConfig,
  computeUnits: number | string,
  connection?: Connection
): Promise<Transaction> {
  const { enabled, rate, useDynamicFee } = config;

  // Check if priority fees should be applied
  if (!isPriorityFeeEnabled(enabled, rate, computeUnits)) {
    console.log(`Priority fee ${txIs}: Priority fees are not enabled for this transaction`);
    return baseTx;
  }

  // Determine priority fee rate
  let priorityFeeRate = parseInt(rate.toString(), 10);

  // If dynamic fees enabled and connection provided, get recommended fee
  if (parseInt(useDynamicFee?.toString() || "0", 10) === 1 && connection) {
    const { medianFee: recommendedFee } = await getRecommendedPriorityFee(connection);
    if (recommendedFee > 0) {
      priorityFeeRate = recommendedFee;
      console.log(`Priority fee ${txIs}: Using dynamic priority fee: ${recommendedFee} microLamports`);
    } else {
      console.log(`Priority fee ${txIs}: Failed to get dynamic fee, falling back to configured rate`);
    }
  }

  // Create priority fee instructions
  const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
    units: parseInt(computeUnits.toString(), 10),
  });

  const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: priorityFeeRate,
  });

  // Wrap the transaction with priority fee instructions
  const wrappedTx = new Transaction().add(modifyComputeUnits).add(addPriorityFee).add(baseTx);

  console.log(`Priority fee ${txIs}: Priority fees applied - Compute Units: ${computeUnits}, Rate: ${priorityFeeRate}`);

  return wrappedTx;
}

/**
 * Helper function to validate priority fee configuration
 */
function isPriorityFeeEnabled(enabled: number | string, rate: number | string, computeUnits: number | string): boolean {
  return (
    !isNaN(parseInt(enabled.toString(), 10)) &&
    parseInt(enabled.toString(), 10) === 1 &&
    !isNaN(parseInt(rate.toString(), 10)) &&
    !isNaN(parseInt(computeUnits.toString(), 10))
  );
}

export async function createAddBondAsVaultTransaction(
  userPublicKey: PublicKey,
  programSol: Program<CoreSolBondStakeSc>,
  addressBondsRewardsPda: PublicKey | undefined,
  bondConfigPda: PublicKey | undefined,
  bondId: number,
  nonce: number
): Promise<{ transaction: Transaction } | undefined> {
  try {
    const bondIdPda = PublicKey.findProgramAddressSync(
      [Buffer.from("bond"), userPublicKey!.toBuffer(), new BN(bondId).toBuffer("le", 2)],
      programSol!.programId
    )[0];

    const transaction = await programSol!.methods
      .updateVaultBond(BOND_CONFIG_INDEX, bondId, new BN(nonce))
      .accounts({
        addressBondsRewards: addressBondsRewardsPda,
        bondConfig: bondConfigPda,
        bond: bondIdPda,
        authority: userPublicKey!,
      })
      .transaction();

    return {
      transaction,
    };
  } catch (error) {
    console.error("Transaction creation failed:", error);
    return undefined;
  }
}

export async function retrieveBondsAndNftMeIdVault(
  userPublicKey: PublicKey,
  lastIndex: number,
  program?: Program<CoreSolBondStakeSc>
): Promise<{ myBonds: Bond[] }> {
  try {
    if (program === undefined) {
      throw new Error("Connection is required to retrieve bonds");
    }

    const myBonds: Bond[] = [];

    // TODO THIS CAN BE improved by using a single fetch, only for the modified bond. not all of them if i just top up one
    for (let i = 1; i <= lastIndex; i++) {
      const bondPda = PublicKey.findProgramAddressSync([Buffer.from("bond"), userPublicKey.toBuffer(), new BN(i).toBuffer("le", 2)], program.programId)[0];
      const bond = await program.account.bond.fetch(bondPda);
      const bondUpgraded = { ...bond, bondId: i, unbondTimestamp: bond.unbondTimestamp.toNumber(), bondTimestamp: bond.bondTimestamp.toNumber() };

      myBonds.push(bondUpgraded);
    }

    return { myBonds };
  } catch (error) {
    console.error("retrieveBondsError", error);

    throw new Error("Retrieve Bonds Error: Not able to fetch the bonds from the blockchain");
  }
}

export async function fetchAddressBondsRewards(programSol: Program<CoreSolBondStakeSc> | undefined, addressBondsRewardsPda: PublicKey | undefined) {
  if (!programSol || !addressBondsRewardsPda) return;

  try {
    const data = await programSol.account.addressBondsRewards.fetch(addressBondsRewardsPda);

    return data;
  } catch (error) {
    // console.error("Failed to fetch address rewards data, might be a new user who never bonded:", error);
    return null;
  }
}

export function getBondingProgramInterface(connection: Connection) {
  const programId = new PublicKey(BONDING_PROGRAM_ID);
  const programInterface = new Program<CoreSolBondStakeSc>(IDL, programId, {
    connection,
  });

  return {
    programId,
    programInterface,
  };
}

export function computeBondScore(lockPeriod: number, currentTimestamp: number, unbondTimestamp: number): number {
  if (currentTimestamp >= unbondTimestamp) {
    return 0;
  } else {
    const difference = unbondTimestamp - currentTimestamp;

    if (lockPeriod === 0) {
      return 0;
    } else {
      const divResult = 10000 / lockPeriod;
      return Number(((divResult * difference) / 100).toFixed(2));
    }
  }
}

export async function getNftMetaForDelayedBonding(dataNftId: string, bondForSolAddr: string, solSignature: string, signatureNonce: string) {
  const headers = {
    "Content-Type": "application/json",
  };

  const requestBody = { dataNftId, bondForSolAddr, solSignature, signatureNonce };

  const res = await fetch(`${getApiDataDex()}/solNftUtils/nftMetaForDelayedBonding`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(requestBody),
  });

  const data = await res.json();

  return data;
}

export async function mintMiscDataNft(mintTemplate: string, mintForSolAddr: string, solSignature: string, signatureNonce: string) {
  try {
    const headers = {
      "Content-Type": "application/json",
    };

    const chainId = import.meta.env.VITE_ENV_NETWORK === "devnet" ? SOL_ENV_ENUM.devnet : SOL_ENV_ENUM.mainnet;

    const requestBody = { mintTemplate, mintForSolAddr, solSignature, signatureNonce, chainId };

    const res = await fetch(`${getApiDataDex()}/solNftUtils/mintMiscDataNft`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();

    return data;
  } catch (e) {
    return {
      error: true,
      e,
    };
  }
}

export async function checkIfFreeDataNftGiftMinted(mintTemplate: string, checkForSolAddr: string) {
  const res = await fetch(`${getApiDataDex()}/solNftUtils/checkIfFreeDataNftGiftMinted?mintTemplate=${mintTemplate}&checkForSolAddr=${checkForSolAddr}`, {
    method: "GET",
  });

  const data = await res.json();

  return data;
}

export async function itheumSolPreaccess() {
  const chainId = import.meta.env.VITE_ENV_NETWORK === "devnet" ? SOL_ENV_ENUM.devnet : SOL_ENV_ENUM.mainnet;
  const preaccessUrl = `${getApiDataMarshal()}/preaccess?chainId=${chainId}`;
  const response = await fetch(preaccessUrl);
  const data = await response.json();
  return data.nonce;
}

/*
This method will get the Solana Data Marshal access nonce and Signature
from local app cache (so we don't have to keep asking for a signature)
or if the cache is not suitable, then get a fresh nonce and sig and cache it again
*/
export async function getOrCacheAccessNonceAndSignature({
  solPreaccessNonce,
  solPreaccessSignature,
  solPreaccessTimestamp,
  signMessage,
  publicKey,
  updateSolPreaccessNonce,
  updateSolSignedPreaccess,
  updateSolPreaccessTimestamp,
}: {
  solPreaccessNonce: string;
  solPreaccessSignature: string;
  solPreaccessTimestamp: number;
  signMessage: any;
  publicKey: any;
  updateSolPreaccessNonce: any;
  updateSolSignedPreaccess: any;
  updateSolPreaccessTimestamp: any;
}) {
  let usedPreAccessNonce = solPreaccessNonce;
  let usedPreAccessSignature = solPreaccessSignature;

  // Marshal Access lasts for 30 Mins. We cache it for this amount of time
  const minsMarshalAllowsForNonceCaching = 20;

  if (solPreaccessSignature === "" || solPreaccessTimestamp === -2 || solPreaccessTimestamp + minsMarshalAllowsForNonceCaching * 60 * 1000 < Date.now()) {
    const preAccessNonce = await itheumSolPreaccess();
    const message = new TextEncoder().encode(preAccessNonce);

    if (signMessage === undefined) {
      throw new Error("signMessage is undefined");
    }

    const signature = await signMessage(message);

    if (!preAccessNonce || !signature || !publicKey) {
      throw new Error("Missing data for viewData");
    }

    // const encodedSignature = Buffer.from(signature).toString("hex"); // this format was another way we did it, and the backend api used it. but we aligned he backend api to be same as below
    const encodedSignature = bs58.encode(signature); // the marshal needs it in bs58

    updateSolPreaccessNonce(preAccessNonce);
    updateSolSignedPreaccess(encodedSignature);
    updateSolPreaccessTimestamp(Date.now()); // in MS

    usedPreAccessNonce = preAccessNonce;
    usedPreAccessSignature = encodedSignature;

    // console.log("------> Signature Session NOT FROM Cache");
  } else {
    // console.log("------> Signature Session FROM Cache");
  }

  return {
    usedPreAccessNonce,
    usedPreAccessSignature,
  };
}

export async function sendAndConfirmTransaction({
  txIs,
  userPublicKey,
  connection,
  transaction,
  sendTransaction,
}: {
  txIs: string;
  userPublicKey: PublicKey;
  connection: Connection;
  transaction: Transaction;
  sendTransaction: any;
}): Promise<{ confirmationPromise: Promise<any>; txSignature: string }> {
  const maxRetries = 3;
  let currentRetry = 0;
  let lastError: any;

  while (currentRetry < maxRetries) {
    try {
      console.log(`sendAndConfirmTransaction ${txIs}: Transaction send attempt ${currentRetry} of ${maxRetries}.`);

      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = userPublicKey;

      const txSignature = await sendTransaction(transaction, connection, {
        skipPreflight: true,
        preflightCommitment: "finalized",
      });

      const strategy: TransactionConfirmationStrategy = {
        signature: txSignature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      };

      const confirmationPromise = connection.confirmTransaction(strategy, "finalized" as Commitment);

      console.log(`sendAndConfirmTransaction ${txIs}: Transaction confirmed, attempt ${currentRetry} of ${maxRetries}.`);

      return { confirmationPromise, txSignature };
    } catch (error) {
      lastError = error;
      currentRetry++;
      if (currentRetry < maxRetries) {
        console.log(`sendAndConfirmTransaction ${txIs}: Transaction failed, attempt ${currentRetry} of ${maxRetries}. Retrying in 5 seconds...`);
        await new Promise((resolve) => setTimeout(resolve, 10000)); // Sleep for 10 seconds
      }
    }
  }

  console.log(`sendAndConfirmTransaction ${txIs}: All retry attempts failed`);
  // Return a promise that resolves to a format matching the expected response structure
  return {
    confirmationPromise: Promise.resolve({ value: { err: lastError } }),
    txSignature: "",
  };
}

export function sortDataNftsByLeafIdDesc(allDataNfts: DasApiAsset[]) {
  const _OrderByLeadIdDataNfts = [...allDataNfts].sort((a, b) => {
    if (a.compression.leaf_id > b.compression.leaf_id) {
      return -1;
    } else {
      return 1;
    }
  });

  return _OrderByLeadIdDataNfts;
}

export async function getInitAddressBondsRewardsPdaTransaction(connection: Connection, userPublicKey: PublicKey) {
  const programId = new PublicKey(BONDING_PROGRAM_ID);
  const addressBondsRewardsPda = PublicKey.findProgramAddressSync([Buffer.from("address_bonds_rewards"), userPublicKey?.toBuffer()], programId)[0];
  const accountInfo = await connection.getAccountInfo(addressBondsRewardsPda);
  const isExist = accountInfo !== null;

  let wrappedTransaction: Transaction | null = null;

  // if no addressBondsRewardsPda was found, this means the user has never minted and bonded on Solana NFMe contract before -- so we first need to "initializeAddress"
  // ... in this workflow, the user has to sign and submit 2 transactions (initializeAddress and then createBondTransaction)
  if (!isExist) {
    const program = new Program<CoreSolBondStakeSc>(IDL, programId, {
      connection,
    });

    const rewardsConfigPda = PublicKey.findProgramAddressSync([Buffer.from("rewards_config")], programId)[0];

    const baseTransactionInitializeAddress = await program.methods
      .initializeAddress()
      .accounts({
        addressBondsRewards: addressBondsRewardsPda,
        rewardsConfig: rewardsConfigPda,
        authority: userPublicKey,
      })
      .transaction();

    wrappedTransaction = await wrapTransactionWithPriorityFee(
      "initializeAddressTx",
      baseTransactionInitializeAddress,
      priorityFeeConfig as PriorityFeeConfig,
      _SOL_PRIORITY_FEE_COMPUTE_UNITS_TX_INITADDR,
      connection
    );
  }

  return wrappedTransaction;
}

export const getItheumBalanceOnSolana = async (connection: Connection, userPublicKey: PublicKey) => {
  try {
    const itheumTokenMint = new PublicKey(ITHEUM_SOL_TOKEN_ADDRESS);
    const addressAta = getAssociatedTokenAddressSync(itheumTokenMint, userPublicKey!, false);
    const balance = await connection.getTokenAccountBalance(addressAta);
    return balance.value.uiAmount;
  } catch (error) {
    console.error("Error fetching Itheum" + ITHEUM_SOL_TOKEN_ADDRESS + "  balance on Solana " + import.meta.env.VITE_ENV_NETWORK + " blockchain:", error);
    throw error;
  }
};

export const swapForItheumTokensOnJupiter = (wallet: any, onSuccessCallback: any) => {
  if (!wallet) return;

  window.Jupiter.init({
    onSuccess: ({ txid, swapResult }: any) => {
      console.log({ txid });

      onSuccessCallback();
    },
    endpoint: import.meta.env.VITE_ENV_SOLANA_NETWORK_RPC,
    passThroughWallet: wallet,
    containerStyles: { maxHeight: "60vh" },
    formProps: {
      fixedOutputMint: true,
      swapMode: "ExactInOut",
      initialAmount: "100000000",
      initialOutputMint: import.meta.env.VITE_ENV_ITHEUM_SOL_TOKEN_ADDRESS,
      initialInputMint: NATIVE_MINT.toBase58(),
    },
  });
};

export async function fetchUserBadges(solAddress: string | undefined) {
  if (!solAddress) {
    return [];
  } else {
    const resp = await fetch(`${getApiDataDex()}/userAccounts/getBadges?addr=${solAddress}`);
    const data = await resp.json();

    return data;
  }
}

export async function fetchBadgesLookup() {
  const resp = await fetch(`${getApiDataDex()}/userAccounts/getBadgeLookup`);
  const data = await resp.json();

  return data;
}

export async function claimBadge(addr: string | undefined, claimThisBadgeId: string) {
  if (!addr || !claimThisBadgeId) {
    return { error: true };
  } else {
    const headers = {
      "Content-Type": "application/json",
    };

    const requestBody = { addr, claimThisBadgeId };

    const res = await fetch(`${getApiDataDex()}/userAccounts/claimBadge`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();

    if (data.error) {
      return data;
    } else {
      return { success: true };
    }
  }
}

export async function issueBadge(addr: string | undefined, issueThisBadgeId: string, solPreaccessNonce: string, solPreaccessSignature: string) {
  if (!addr || !issueThisBadgeId || !solPreaccessNonce || !solPreaccessSignature) {
    return { error: true };
  } else {
    const headers = {
      "Content-Type": "application/json",
    };

    const requestBody = { addr, issueThisBadgeId, solSignature: solPreaccessSignature, signatureNonce: solPreaccessNonce };

    const res = await fetch(`${getApiDataDex()}/userAccounts/issueBadge`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();

    return data;
  }
}
