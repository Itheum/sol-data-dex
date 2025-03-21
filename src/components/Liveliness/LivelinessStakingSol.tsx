import React, { useState, useEffect } from "react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Progress,
  Text,
  Tooltip,
  VStack,
  Spinner,
  Card,
  UnorderedList,
  ListItem,
  Link,
  Alert,
  AlertIcon,
  useColorMode,
  useToast,
} from "@chakra-ui/react";
import { Program, BN } from "@coral-xyz/anchor";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import moment from "moment/moment";
import { useNavigate, useSearchParams } from "react-router-dom";
import NftMediaComponent from "components/NftMediaComponent";
import { NoDataHere } from "components/Sections/NoDataHere";
import { ConfirmationDialog } from "components/UtilComps/ConfirmationDialog";
import { useNetworkConfiguration } from "contexts/sol/SolNetworkConfigurationProvider";
import { BOND_CONFIG_INDEX, SOLANA_EXPLORER_URL, SOLSCAN_EXPLORER_URL } from "libs/Solana/config";
import { CoreSolBondStakeSc } from "libs/Solana/CoreSolBondStakeSc";
import { Bond } from "libs/Solana/types";
import { sendAndConfirmTransaction, createAddBondAsVaultTransaction, checkIfFreeDataNftGiftMinted } from "libs/Solana/utils";
import {
  computeAddressClaimableAmount,
  computeBondScore,
  ITHEUM_SOL_TOKEN_ADDRESS,
  retrieveBondsAndNftMeIdVault,
  SLOTS_IN_YEAR,
  fetchAddressBondsRewards,
  getBondingProgramInterface,
} from "libs/Solana/utils";
import { formatNumberToShort, isValidNumericCharacter, sleep } from "libs/utils";
import { FocusOnThisEffect } from "libs/utils/ui";
import { scrollToSection } from "libs/utils/ui";
import { useAccountStore } from "store";
import { useMintStore } from "store/mint";
import { useNftsStore } from "store/nfts";
import { LivelinessScore } from "./LivelinessScore";

const BN10_9 = new BN(10 ** 9);

export const LivelinessStakingSol: React.FC = () => {
  const navigate = useNavigate();
  const { connection } = useConnection();
  const { publicKey: userPublicKey, sendTransaction } = useWallet();
  const itheumBalance = useAccountStore((state) => state.itheumBalance);
  const [estCombinedAnnualRewards, setEstCombinedAnnualRewards] = useState<number>(0);
  const updateItheumBalance = useAccountStore((state) => state.updateItheumBalance);
  const updateIsKeyChainDataForAppLoading = useAccountStore((state) => state.updateIsKeyChainDataForAppLoading);
  const [vaultLiveliness, setVaultLiveliness] = useState<number>(0);
  const [combinedBondsStaked, setCombinedBondsStaked] = useState<BN>(new BN(0));
  const [rewardApr, setRewardApr] = useState<number>(0);
  const [maxApr, setMaxApr] = useState<number>(0);
  const [addressClaimableAmount, setAddressClaimableAmount] = useState<number>(0);
  const [globalTotalBond, setGlobalTotalBond] = useState<BN>(new BN(0));
  const [globalRewardsPerBlock, setGlobalRewardsPerBlock] = useState<number>(0);
  const [withdrawPenalty, setWithdrawPenalty] = useState<number>(0);
  const [bondingProgram, setBondingProgram] = useState<Program<CoreSolBondStakeSc> | undefined>();
  const [bondConfigPda, setBondConfigPda] = useState<PublicKey | undefined>();
  const [addressBondsRewardsPda, setAddressBondsRewardsPda] = useState<PublicKey | undefined>();
  const [rewardsConfigPda, setRewardsConfigPda] = useState<PublicKey | undefined>();
  const [addressBondsRewardsData, setAddressBondsRewardsData] = useState<any>();
  const [bondConfigData, setBondConfigData] = useState<any>();
  const [rewardsConfigData, setRewardsConfigData] = useState<any>();
  const [vaultConfigPda, setVaultConfigPda] = useState<PublicKey | undefined>();
  const [bonds, setBonds] = useState<Bond[]>();
  const [allInfoLoading, setAllInfoLoading] = useState<boolean>(true);
  const [numberOfBonds, setNumberOfBonds] = useState<number>();
  const [vaultBondId, setVaultBondId] = useState<number>();
  const [vaultBondData, setVaultBondData] = useState<any>();
  const [claimRewardsConfirmationWorkflow, setClaimRewardsConfirmationWorkflow] = useState<boolean>(false);
  const [reinvestRewardsConfirmationWorkflow, setReinvestRewardsConfirmationWorkflow] = useState<boolean>(false);
  const { allDataNfts, updateBondedDataNftIds } = useNftsStore();
  const { updateUsersNfMeIdVaultBondId, updateFreeNfMeIdClaimed, freeNfMeIdClaimed } = useMintStore();
  const { colorMode } = useColorMode();
  const [claimableAmount, setClaimableAmount] = useState<number>(0);
  const [withdrawBondConfirmationWorkflow, setWithdrawBondConfirmationWorkflow] = useState<{ bondId: number; bondAmount: number; bondExpired: boolean }>();
  const toast = useToast();
  const [hasPendingTransaction, setHasPendingTransaction] = useState<boolean>(false);
  const { networkConfiguration } = useNetworkConfiguration();
  const [dateNowTS, setDateNowTS] = useState<number>(0); // we use Date.now() or .getTime() in various parts of the code that need to be synced. It's best we only use one so its all in sync. BUT only for parts that need syncing (e.g. vault liveliness)
  const [searchParams] = useSearchParams();
  const [deepLinkHlSection, setDeepLinkHlSection] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!userPublicKey) return;

    async function bootstrapLogicAfterDelay() {
      await sleep(3);

      if (!userPublicKey) return;

      // for performance, if the user jumped tabs, abort all the bootstrap logic below. Should do this for any pages that have heavy PRC logic
      if (!window.location.href.includes("/liveliness")) {
        return;
      }

      // check if the user has done a "free mint" as the CTAs will change based on this
      const freeNfMeIdMinted = await checkIfFreeDataNftGiftMinted("nfmeid", userPublicKey.toBase58());

      if (freeNfMeIdMinted.alreadyGifted) {
        updateFreeNfMeIdClaimed(true);
      }

      const programObj = getBondingProgramInterface(connection);
      const programId = programObj.programId;

      setBondingProgram(programObj.programInterface);

      async function fetchBondConfigPDAs() {
        const bondConfigPda1 = PublicKey.findProgramAddressSync([Buffer.from("bond_config"), Buffer.from([BOND_CONFIG_INDEX])], programId)[0];
        setBondConfigPda(bondConfigPda1);

        const _rewardsConfigPda = PublicKey.findProgramAddressSync([Buffer.from("rewards_config")], programId)[0];
        setRewardsConfigPda(_rewardsConfigPda);

        const vaultConfig = PublicKey.findProgramAddressSync([Buffer.from("vault_config")], programId)[0];
        setVaultConfigPda(vaultConfig);

        if (!userPublicKey) return;

        const _addressBondsRewardsPda = PublicKey.findProgramAddressSync([Buffer.from("address_bonds_rewards"), userPublicKey?.toBuffer()], programId)[0];
        setAddressBondsRewardsPda(_addressBondsRewardsPda);
      }

      fetchBondConfigPDAs();

      setDateNowTS(Date.now()); // this is the master Date.now() we can use to sync liveliness etc

      // now that we have the data, we can scroll down to some focus sections if the user came from a deep link
      await sleep(3);

      const isHlWorkflowDeepLink = searchParams.get("hl");

      if (isHlWorkflowDeepLink) {
        setDeepLinkHlSection(isHlWorkflowDeepLink);

        if (isHlWorkflowDeepLink === "topup") {
          scrollToSection("section-topup", 200);
        } else if (isHlWorkflowDeepLink === "makevault") {
          scrollToSection("section-makevault", 200);
        }
      }
    }

    bootstrapLogicAfterDelay();
    updateIsKeyChainDataForAppLoading(true);
  }, [userPublicKey]);

  // At the start and also after each pending TX completes, we get the latest bonds, rewards (staked, vault id etc) and vault data (i.e. total bond)
  useEffect(() => {
    if (bondingProgram && userPublicKey && !hasPendingTransaction) {
      fetchBonds();
      fetchAddressRewardsData();
      fetchVaultConfigData();
    }
  }, [hasPendingTransaction]);

  useEffect(() => {
    if (bondConfigData && rewardsConfigData && addressBondsRewardsData && globalTotalBond) {
      computeAndSetClaimableAmount();
    }
  }, [bondConfigData, rewardsConfigData, addressBondsRewardsData]);

  useEffect(() => {
    async function fetchAccountInfo() {
      if (bondingProgram && userPublicKey && addressBondsRewardsPda) {
        const accountInfo = await connection.getAccountInfo(addressBondsRewardsPda);
        const isExist = accountInfo !== null;

        if (!isExist) {
          livelinessPageInfoLoaded();
        } else {
          fetchAddressRewardsData();
        }
      }
    }

    fetchAccountInfo();
  }, [addressBondsRewardsPda, bondingProgram]);

  useEffect(() => {
    fetchBonds();
  }, [numberOfBonds]);

  useEffect(() => {
    fetchRewardsConfigData();
  }, [rewardsConfigPda, bondingProgram]);

  useEffect(() => {
    if (bondingProgram && userPublicKey && bondConfigPda) {
      bondingProgram?.account.bondConfig.fetch(bondConfigPda).then((data: any) => {
        setBondConfigData(data);
        setWithdrawPenalty(new BN(data.withdrawPenalty).toNumber() / 100);
      });
    }
  }, [bondConfigPda, bondingProgram]);

  useEffect(() => {
    fetchVaultConfigData();
  }, [vaultConfigPda, bondingProgram]);

  useEffect(() => {
    calculateRewardAprAndEstAnnualRewards();
  }, [globalTotalBond, combinedBondsStaked, maxApr]);

  useEffect(() => {
    if (bondConfigData && vaultBondData) {
      const vaultScore = computeBondScore(bondConfigData.lockPeriod.toNumber(), Math.floor(dateNowTS / 1000), vaultBondData.unbondTimestamp.toNumber());
      setVaultLiveliness(vaultScore);
    }
  }, [bondConfigData, vaultBondData]);

  function livelinessPageInfoLoaded() {
    updateIsKeyChainDataForAppLoading(false); // notify whole app that all info is loaded related to liveliness
    setAllInfoLoading(false); // notify this page that all info is loaded
  }

  async function fetchRewardsConfigData() {
    if (bondingProgram && userPublicKey && rewardsConfigPda) {
      bondingProgram.account.rewardsConfig.fetch(rewardsConfigPda).then((data: any) => {
        setRewardsConfigData(data);
        setGlobalRewardsPerBlock(data.rewardsPerSlot.toNumber());
        setMaxApr(data.maxApr.toNumber() / 100);
      });
    }
  }

  async function fetchVaultConfigData() {
    if (bondingProgram && vaultConfigPda) {
      bondingProgram.account.vaultConfig.fetch(vaultConfigPda).then((data: any) => {
        setGlobalTotalBond(data.totalBondAmount);
      });
    }
  }

  async function computeAndSetClaimableAmount() {
    const currentSLot = await connection.getSlot();

    const _claimableAmount = computeAddressClaimableAmount(
      new BN(currentSLot),
      rewardsConfigData,
      addressBondsRewardsData.addressRewardsPerShare,
      addressBondsRewardsData.addressTotalBondAmount,
      globalTotalBond
    );

    setClaimableAmount(_claimableAmount / 10 ** 9 + addressClaimableAmount);
  }

  async function fetchAddressRewardsData() {
    if (!bondingProgram || !addressBondsRewardsPda) return;

    try {
      const userBondsInfo = await fetchAddressBondsRewards(bondingProgram, addressBondsRewardsPda);

      if (userBondsInfo) {
        setAddressBondsRewardsData(userBondsInfo);
        setCombinedBondsStaked(userBondsInfo.addressTotalBondAmount);
        setAddressClaimableAmount(userBondsInfo.claimableAmount.toNumber() / 10 ** 9);
        setNumberOfBonds(userBondsInfo.currentIndex);
        setVaultBondId(userBondsInfo.vaultBondId);

        updateUsersNfMeIdVaultBondId(userBondsInfo.vaultBondId); // update the store as well

        if (numberOfBonds && numberOfBonds > 0 && userBondsInfo.vaultBondId === 0) {
          toast({
            title: "NFMe ID Vault Warning",
            description: "You have not set a NFMe ID as your 'vault' yet",
            status: "info",
            duration: 15000,
            isClosable: true,
          });
        }

        if (userBondsInfo.vaultBondId != 0) {
          const vaultBond = await bondingProgram!.account.bond.fetch(
            PublicKey.findProgramAddressSync(
              [Buffer.from("bond"), userPublicKey!.toBuffer(), new BN(userBondsInfo.vaultBondId).toBuffer("le", 2)],
              bondingProgram.programId
            )[0]
          );
          if (vaultBond.state === 0) {
            toast({
              title: "Vault Warning",
              description: "Your vault bond is inactive, please change it to able to claim rewards",
              status: "warning",
              duration: 15000,
              isClosable: true,
            });
          }
          setVaultBondData(vaultBond);
        }

        if (userBondsInfo.currentIndex === 0) {
          livelinessPageInfoLoaded();
        }
      } else {
        console.error("Failed to fetch address rewards data");
      }
    } catch (error) {
      console.error("Failed to fetch address rewards data:", error);
    }
  }

  function calculateRewardAprAndEstAnnualRewards(value?: number, amount?: BN) {
    if (combinedBondsStaked.toNumber() === 0) {
      setRewardApr(0);
      return;
    }

    if (globalTotalBond.toNumber() > 0) {
      if (value) {
        value = value * 10 ** 9;
      } else {
        value = 0;
      }

      const amountToCompute = amount ? amount.add(new BN(value)) : combinedBondsStaked;
      const percentage: number = amountToCompute.toNumber() / globalTotalBond.toNumber();
      const localRewardsPerBlock: number = globalRewardsPerBlock * percentage;
      const rewardPerYear: number = localRewardsPerBlock * SLOTS_IN_YEAR;
      const calculatedRewardApr = Math.floor((rewardPerYear / amountToCompute.toNumber()) * 10000) / 100;

      if (!value) {
        if (maxApr === 0) {
          setRewardApr(calculatedRewardApr);
        } else {
          setRewardApr(Math.min(calculatedRewardApr, maxApr));
        }
      }

      if (maxApr === 0 || calculatedRewardApr < maxApr) {
        if (amount) {
          return rewardPerYear;
        }

        setEstCombinedAnnualRewards(rewardPerYear);
      } else {
        if (amount) {
          return (amountToCompute.toNumber() * maxApr) / 100;
        }

        setEstCombinedAnnualRewards((amountToCompute.toNumber() * maxApr) / 100);
      }
    }
  }

  async function fetchBonds() {
    if (numberOfBonds && userPublicKey && bondingProgram) {
      retrieveBondsAndNftMeIdVault(userPublicKey, numberOfBonds, bondingProgram).then(({ myBonds }) => {
        setBonds(myBonds);

        updateBondedDataNftIds(myBonds.map((i) => i.assetId.toBase58()));

        livelinessPageInfoLoaded();
      });
    }
  }

  async function executeTransaction({
    txIs,
    transaction,
    customErrorMessage = "Transaction failed",
  }: {
    txIs: string;
    transaction: Transaction;
    customErrorMessage?: string;
  }) {
    try {
      if (!userPublicKey) {
        throw new Error("Wallet not connected");
      }

      setHasPendingTransaction(true);

      const { confirmationPromise, txSignature } = await sendAndConfirmTransaction({
        txIs,
        userPublicKey,
        connection,
        transaction,
        sendTransaction,
      });

      toast.promise(
        confirmationPromise.then((response) => {
          if (response.value.err) {
            console.error("Transaction failed:", response.value);
            throw new Error(customErrorMessage);
          }
        }),
        {
          success: {
            title: "Transaction Confirmed",
            description: (
              <a
                href={`${SOLANA_EXPLORER_URL}/tx/${txSignature}?cluster=${networkConfiguration}`}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: "underline" }}>
                View on Solana explorer <ExternalLinkIcon margin={3} />
              </a>
            ),
            duration: 12000,
            isClosable: true,
          },
          error: {
            title: customErrorMessage,
            description: (
              <a
                href={`${SOLANA_EXPLORER_URL}/tx/${txSignature}?cluster=${networkConfiguration}`}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: "underline" }}>
                View on Solana explorer <ExternalLinkIcon margin={3} />
              </a>
            ),
            duration: 12000,
            isClosable: true,
          },
          loading: { title: "Processing Transaction", description: "Please wait...", colorScheme: "blue" },
        }
      );

      const result = await confirmationPromise;

      setHasPendingTransaction(false);

      if (result.value.err) {
        return false;
      }

      return txSignature;
    } catch (error) {
      setHasPendingTransaction(false);

      toast({
        title: "User rejected the request",
        description: (error as Error).message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });

      throw error;
    }
  }

  async function renewBondSol(bondId: number) {
    try {
      const bondIdPda = PublicKey.findProgramAddressSync(
        [Buffer.from("bond"), userPublicKey!.toBuffer(), new BN(bondId).toBuffer("le", 2)],
        bondingProgram!.programId
      )[0];

      const transaction = await bondingProgram!.methods
        .renew(BOND_CONFIG_INDEX, bondId)
        .accounts({
          bondConfig: bondConfigPda,
          rewardsConfig: rewardsConfigPda,
          vaultConfig: vaultConfigPda,
          addressBondsRewards: addressBondsRewardsPda,
          bond: bondIdPda,
          authority: userPublicKey!,
        })
        .transaction();

      await executeTransaction({
        txIs: "renewBondTx",
        transaction,
        customErrorMessage: "Failed to renew bond",
      });

      // this is the master Date.now() we can use to sync liveliness in the UI (need to reset as the bond unbondTimestamp will be updated -- or else, we will get 100%+)
      setDateNowTS(Date.now());
    } catch (error) {
      console.error("Failed to renew bond:", error);
    }
  }

  async function updateVaultBond(bondId: number, nonce: number) {
    try {
      if (!userPublicKey || !bondingProgram) {
        return;
      }
      const createTxResponse = await createAddBondAsVaultTransaction(userPublicKey, bondingProgram, addressBondsRewardsPda, bondConfigPda, bondId, nonce);

      if (createTxResponse) {
        await executeTransaction({
          txIs: "updateVaultTx",
          transaction: createTxResponse.transaction,
          customErrorMessage: "Failed to update vault bond",
        });
      } else {
        console.error("Failed to create the vault bond transaction");
      }
    } catch (error) {
      console.error("Failed to update vault bond:", error);
    }
  }

  async function topUpBondSol(bondId: number, amount: number) {
    try {
      if (bondId === 0) {
        console.error("Bond not found, id is 0");
        return;
      }

      const bondIdPda = PublicKey.findProgramAddressSync(
        [Buffer.from("bond"), userPublicKey!.toBuffer(), new BN(bondId).toBuffer("le", 2)],
        bondingProgram!.programId
      )[0];

      const vaultAta = await getAssociatedTokenAddress(new PublicKey(ITHEUM_SOL_TOKEN_ADDRESS), vaultConfigPda!, true);
      const userItheumAta = await getAssociatedTokenAddress(new PublicKey(ITHEUM_SOL_TOKEN_ADDRESS), userPublicKey!, true);
      const amountToSend: BN = new BN(amount).mul(BN10_9);

      const transaction = await bondingProgram!.methods
        .topUp(BOND_CONFIG_INDEX, bondId, amountToSend)
        .accounts({
          addressBondsRewards: addressBondsRewardsPda,
          bondConfig: bondConfigPda,
          rewardsConfig: rewardsConfigPda,
          mintOfTokenSent: new PublicKey(ITHEUM_SOL_TOKEN_ADDRESS),
          bond: bondIdPda,
          vaultConfig: vaultConfigPda,
          vault: vaultAta,
          authority: userPublicKey!,
          authorityTokenAccount: userItheumAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .transaction();

      const result = await executeTransaction({
        txIs: "topUpTx",
        transaction,
        customErrorMessage: "Failed to top-up bond",
      });

      if (result) {
        updateItheumBalance(itheumBalance - amount);
      }

      // this is the master Date.now() we can use to sync liveliness in the UI (need to reset as the bond unbondTimestamp will be updated -- or else, we will get 100%+)
      setDateNowTS(Date.now());
    } catch (error) {
      console.error("Transaction to top-up bond failed:", error);
    }
  }

  const calculateNewPeriodAfterNewBond = (lockPeriod: number) => {
    const nowTSInSec = Math.round(Date.now() / 1000);
    const newExpiry = new Date((nowTSInSec + lockPeriod) * 1000);
    return newExpiry.toDateString();
  };

  async function handleClaimRewardsClick(_vaultBondId: number) {
    try {
      if (!bondingProgram || !userPublicKey) return;
      const vaultAta = await getAssociatedTokenAddress(new PublicKey(ITHEUM_SOL_TOKEN_ADDRESS), vaultConfigPda!, true);
      const userItheumAta = await getAssociatedTokenAddress(new PublicKey(ITHEUM_SOL_TOKEN_ADDRESS), userPublicKey!, true);
      const bondPda = PublicKey.findProgramAddressSync(
        [Buffer.from("bond"), userPublicKey.toBuffer(), new BN(_vaultBondId).toBuffer("le", 2)],
        bondingProgram.programId
      )[0];

      const transaction = await bondingProgram.methods
        .claimRewards(BOND_CONFIG_INDEX, _vaultBondId)
        .accounts({
          addressBondsRewards: addressBondsRewardsPda,
          bondConfig: bondConfigPda,
          rewardsConfig: rewardsConfigPda,
          mintOfTokenToReceive: new PublicKey(ITHEUM_SOL_TOKEN_ADDRESS),
          vaultConfig: vaultConfigPda,
          vault: vaultAta,
          bond: bondPda,
          authority: userPublicKey,
          authorityTokenAccount: userItheumAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .transaction();

      const result = await executeTransaction({
        txIs: "claimRewardsTx",
        transaction,
        customErrorMessage: "Failed to claim the rewards failed",
      });
      if (result) updateItheumBalance(itheumBalance + (vaultLiveliness >= 95 ? claimableAmount : (vaultLiveliness * claimableAmount) / 100));
    } catch (error) {
      console.error("Transaction ClaimingRewards failed:", error);
    }
  }

  async function handleReinvestRewardsClick(_vaultBondId: number) {
    try {
      if (!bondingProgram || !userPublicKey || !_vaultBondId) return;

      const bondIdPda = PublicKey.findProgramAddressSync(
        [Buffer.from("bond"), userPublicKey!.toBuffer(), new BN(_vaultBondId).toBuffer("le", 2)],
        bondingProgram!.programId
      )[0];

      const transaction = await bondingProgram.methods
        .stakeRewards(BOND_CONFIG_INDEX, _vaultBondId)
        .accounts({
          addressBondsRewards: addressBondsRewardsPda,
          bondConfig: bondConfigPda,
          rewardsConfig: rewardsConfigPda,
          bond: bondIdPda,
          vaultConfig: vaultConfigPda,
          authority: userPublicKey,
        })
        .transaction();

      await executeTransaction({
        txIs: "reInvestTx",
        transaction,
        customErrorMessage: "Failed to re-invest the rewards",
      });

      // this is the master Date.now() we can use to sync liveliness in the UI (need to reset as the bond unbondTimestamp will be updated -- or else, we will get 100%+)
      setDateNowTS(Date.now());
    } catch (error) {
      console.error("Transaction Re-Investing failed:", error);
    }
  }

  async function handleWithdrawBondClick(bondId: number, bondAmountToReceive: number) {
    try {
      if (!bondingProgram || !userPublicKey || bondId <= 0) return;

      const bondIdPda = PublicKey.findProgramAddressSync(
        [Buffer.from("bond"), userPublicKey.toBuffer(), new BN(bondId).toBuffer("le", 2)],
        bondingProgram.programId
      )[0];
      const vaultAta = await getAssociatedTokenAddress(new PublicKey(ITHEUM_SOL_TOKEN_ADDRESS), vaultConfigPda!, true);
      const userItheumAta = await getAssociatedTokenAddress(new PublicKey(ITHEUM_SOL_TOKEN_ADDRESS), userPublicKey!, true);

      const transaction = await bondingProgram.methods
        .withdraw(BOND_CONFIG_INDEX, bondId)
        .accounts({
          addressBondsRewards: addressBondsRewardsPda,
          bondConfig: bondConfigPda,
          rewardsConfig: rewardsConfigPda,
          mintOfTokenToReceive: new PublicKey(ITHEUM_SOL_TOKEN_ADDRESS),
          bond: bondIdPda,
          vaultConfig: vaultConfigPda,
          vault: vaultAta,
          authority: userPublicKey!,
          authorityTokenAccount: userItheumAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .transaction();

      const result = await executeTransaction({
        txIs: "withdrawTx",
        transaction,
        customErrorMessage: "Failed to withdraw the rewards",
      });
      if (result) updateItheumBalance(itheumBalance + bondAmountToReceive);
    } catch (error) {
      console.error("Transaction withdraw failed:", error);
    }
  }

  const TopUpSection: React.FC<{ bond: Bond }> = ({ bond }) => {
    const [currentBondEstAnnualRewards, setCurrentBondEstAnnualRewards] = useState<number>();
    const [topUpItheumValue, setTopUpItheumValue] = useState<number>(0);

    return (
      <HStack my={2} justifyContent="center" alignItems="flex-start" w="100%">
        <VStack alignItems={"start"} w={"100%"} justifyContent="space-between">
          <Text fontSize="xl" alignItems={"flex-start"} fontFamily="Inter" color="teal.200" fontWeight="bold">
            Top-Up Liveliness for Boosted Rewards
          </Text>
          <Text fontSize="lg">Available Balance: {formatNumberToShort(itheumBalance)} $ITHEUM</Text>
          <Flex justifyContent="space-between" flexDirection={{ base: "column", md: "row" }} alignItems={{ base: "normal", md: "baseline" }} minH="68px">
            <Box>
              <HStack my={2}>
                <Text fontSize="lg" color={"grey"}>
                  Top-Up Liveliness
                </Text>
                <NumberInput
                  ml="3px"
                  size="sm"
                  maxW="24"
                  step={1}
                  min={0}
                  max={itheumBalance}
                  isValidCharacter={isValidNumericCharacter}
                  value={topUpItheumValue}
                  onChange={(value) => {
                    setTopUpItheumValue(Number(value));
                    const estRewards = calculateRewardAprAndEstAnnualRewards(Number(value), bond?.bondAmount);
                    setCurrentBondEstAnnualRewards(estRewards);
                  }}
                  keepWithinRange={true}>
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <Button
                  colorScheme="teal"
                  size="sm"
                  variant="outline"
                  px={4}
                  isDisabled={!userPublicKey}
                  onClick={() => {
                    setTopUpItheumValue(Math.floor(itheumBalance));
                    const estRewards = calculateRewardAprAndEstAnnualRewards(itheumBalance, bond?.bondAmount);
                    setCurrentBondEstAnnualRewards(estRewards);
                  }}>
                  MAX
                </Button>
              </HStack>
            </Box>
            <Box textAlign={{ base: "right", md: "initial" }} ml="10px" position="relative">
              {deepLinkHlSection === "topup" && <FocusOnThisEffect top="-10px" />}
              <Button
                colorScheme="teal"
                px={6}
                size="sm"
                isDisabled={!userPublicKey || topUpItheumValue < 1 || hasPendingTransaction}
                onClick={() => {
                  topUpBondSol(bond?.bondId ?? 0, topUpItheumValue); // top up works only with the vault bond
                }}>
                Top-Up Now
              </Button>
              <Text mt={2} fontSize="sm" color="grey">
                Top-up will also renew bond
              </Text>
            </Box>
          </Flex>
          {currentBondEstAnnualRewards && (
            <Text m={{ base: "auto", md: "initial" }} mt={{ base: "10", md: "2" }} fontSize="md">
              Estimated Bond Annual Rewards (After Top-Up): {formatNumberToShort(currentBondEstAnnualRewards / 10 ** 9)} $ITHEUM
            </Text>
          )}
          <Box id="section-topup" />
        </VStack>
      </HStack>
    );
  };

  function checkIfBondIsExpired(unbondTimestamp: any) {
    return unbondTimestamp < Math.round(Date.now() / 1000);
  }

  const LivelinessContainer: React.FC<{ bond: Bond }> = ({ bond }) => {
    return (
      <VStack>
        <LivelinessScore unbondTimestamp={bond?.unbondTimestamp} lockPeriod={bondConfigData?.lockPeriod.toNumber()} useThisDateNowTS={dateNowTS} />
        <Text fontSize="sm" mr="auto" opacity={0.7}>
          {checkIfBondIsExpired(bond?.unbondTimestamp) ? (
            "Expired, please renew bond..."
          ) : (
            <>{`Expires On: ${moment(bond?.unbondTimestamp * 1000).format("DD/MM/YYYY LT")}`}</>
          )}
        </Text>
        {bond.bondId == vaultBondId && <TopUpSection bond={bond} />}
      </VStack>
    );
  };

  return (
    <Flex flexDirection="column" width="100%">
      <Flex flexDirection={{ base: "column", md: "row" }} width="100%" justifyContent="space-between" pt={{ base: "0", md: "5" }}>
        <Box flex="1" px={{ base: 0, md: 12 }}>
          <Heading fontSize="1.5rem" fontFamily="Clash-Medium" color="teal.200" mb="20px" textAlign={{ base: "center", md: "left" }}>
            Your Liveliness Rewards
          </Heading>

          <VStack border=".1rem solid" borderColor="#00C79740" borderRadius="3xl" p={6} alignItems={"start"} minW={{ md: "36rem" }} minH={{ md: "25rem" }}>
            {allInfoLoading ? (
              <Flex w="100%" h="20rem" justifyContent="center" alignItems="center">
                <Spinner size="md" color="teal.200" />
              </Flex>
            ) : (
              <>
                <>
                  <Text fontSize="3xl">Vault Liveliness: {vaultLiveliness}%</Text>
                  <Progress hasStripe isAnimated value={vaultLiveliness} rounded="base" colorScheme="teal" width="100%" />
                </>

                {numberOfBonds ? (
                  <>
                    <Flex flexDirection={{ base: "column", md: "row" }}>
                      <Text fontSize="xl" w={{ base: "auto", md: "330px" }}>
                        Combined Bonds Staked
                      </Text>{" "}
                      <Text fontSize="xl">: {formatNumberToShort(combinedBondsStaked.toNumber() / 10 ** 9)} $ITHEUM</Text>
                    </Flex>
                    <Flex flexDirection={{ base: "column", md: "row" }}>
                      <Text fontSize="xl" w={{ base: "auto", md: "330px" }}>
                        Global Total Bonded
                      </Text>{" "}
                      <Text fontSize="xl">: {formatNumberToShort(globalTotalBond.div(BN10_9).toNumber())} $ITHEUM</Text>
                    </Flex>
                    <Flex flexDirection={{ base: "column", md: "row" }}>
                      <Text fontSize="xl" w={{ base: "auto", md: "330px" }}>
                        Current Staking APR
                      </Text>{" "}
                      <Text fontSize="xl">: {isNaN(rewardApr) ? 0 : rewardApr}%</Text>
                    </Flex>
                    {maxApr > 0 && (
                      <>
                        <Flex flexDirection={{ base: "column", md: "row" }}>
                          <Text fontSize="xl" w={{ base: "auto", md: "330px" }}>
                            Max APR
                          </Text>{" "}
                          <Text fontSize="xl">: {maxApr}%</Text>
                        </Flex>
                      </>
                    )}
                    <Flex flexDirection={{ base: "column", md: "row" }}>
                      <Text fontSize="xl" w={{ base: "auto", md: "330px" }}>
                        Current Accumulated Rewards
                      </Text>{" "}
                      <Text fontSize="xl">
                        : {formatNumberToShort(vaultLiveliness >= 95 ? claimableAmount : (vaultLiveliness * claimableAmount) / 100)} $ITHEUM
                      </Text>
                    </Flex>
                    <Flex flexDirection={{ base: "column", md: "row" }}>
                      <Text fontSize="xl" w={{ base: "auto", md: "330px" }}>
                        Potential Rewards If Vault Liveliness &gt;95%
                      </Text>{" "}
                      <Text fontSize="xl">: {formatNumberToShort(claimableAmount)} $ITHEUM</Text>
                    </Flex>
                    <HStack mt={5} justifyContent={{ base: "center", md: "start" }} alignItems="flex-start" width="100%" mb={2}>
                      <Flex flexDirection={{ base: "column", md: "row" }}>
                        <VStack mb={{ base: 5, md: 0 }}>
                          <Tooltip
                            hasArrow
                            shouldWrapChildren
                            isDisabled={!(!userPublicKey || claimableAmount < 1 || vaultLiveliness === 0)}
                            label={"Rewards claiming is disabled if liveliness is 0, rewards amount is lower than 1 or there are transactions pending"}>
                            <Box position="relative">
                              {deepLinkHlSection === "claim" && <FocusOnThisEffect top="-10px" />}
                              <Button
                                fontSize="lg"
                                colorScheme="teal"
                                px={6}
                                width="180px"
                                onClick={() => {
                                  if (
                                    computeBondScore(
                                      bondConfigData.lockPeriod.toNumber(),
                                      Math.floor(Date.now() / 1000),
                                      vaultBondData.unbondTimestamp.toNumber()
                                    )
                                  ) {
                                    handleClaimRewardsClick(vaultBondId!);
                                  } else {
                                    setClaimRewardsConfirmationWorkflow(true);
                                  }
                                }}
                                isDisabled={!userPublicKey || claimableAmount < 1 || vaultLiveliness === 0 || hasPendingTransaction || vaultBondId === 0}>
                                Claim Rewards
                              </Button>
                            </Box>
                          </Tooltip>
                        </VStack>
                        <VStack>
                          <Tooltip
                            hasArrow
                            shouldWrapChildren
                            isDisabled={!(!userPublicKey || vaultBondId === 0 || claimableAmount < 1 || vaultLiveliness === 0)}
                            label={
                              "Rewards reinvesting is disabled if you have no NFT as a NFMe ID Vault set, liveliness is 0, rewards amount is lower than 1 or there are transactions pending"
                            }>
                            <Button
                              fontSize="lg"
                              colorScheme="teal"
                              px={6}
                              width="180px"
                              isDisabled={!userPublicKey || claimableAmount < 1 || vaultLiveliness === 0 || hasPendingTransaction || vaultBondId === 0}
                              onClick={() => {
                                setReinvestRewardsConfirmationWorkflow(true);
                              }}>
                              Reinvest Rewards
                            </Button>
                          </Tooltip>
                          <Text fontSize="sm" color="grey" ml={{ md: "55px" }}>
                            Reinvesting rewards will also renew bond
                          </Text>
                        </VStack>
                      </Flex>{" "}
                    </HStack>{" "}
                    <Flex flexDirection={{ base: "column", md: "row" }}>
                      <Text w={{ base: "auto", md: "330px" }} fontSize="lg">
                        Your Estimated Combined Annual Rewards
                      </Text>{" "}
                      <Text fontSize="lg">: {formatNumberToShort(estCombinedAnnualRewards / 10 ** 9)} $ITHEUM</Text>
                    </Flex>
                    {vaultBondId === 0 && (
                      <Alert status="info" mt={2} rounded="md">
                        <AlertIcon />
                        <Box>
                          <Text fontWeight="bold">Got an NFMe ID? 🚀</Text>

                          <Text fontWeight="bold" mt={2}>
                            But you haven’t set one as your {`"Vault"`} yet!
                          </Text>

                          <Text mt={2}>Pick an NFMe ID from the Liveliness Bonds list below and hit {`"Set as NFMe ID Vault"`} to unlock cool perks:</Text>

                          <Box mt={2}>
                            <ul>
                              <li>- Claim/reinvest rewards</li>
                              <li>- Top up bonus $ITHEUM</li>
                              <li>- Boost staking rewards</li>
                            </ul>
                          </Box>

                          <Text mt={2}>{`It’s`} quick and easy—get started now!</Text>
                        </Box>
                      </Alert>
                    )}
                  </>
                ) : (
                  <>
                    <Alert status="info" mt={2} rounded="md">
                      <AlertIcon />
                      {freeNfMeIdClaimed ? (
                        <Box>
                          <Text fontWeight="bold">You have not Bonded $ITHEUM of your NFMe ID yet?</Text>
                          <Text mt="1">Bond now to:</Text>
                          <Text mt={2}>
                            <ul>
                              <li>- Build your Liveliness</li>
                              <li>- Earn awesome staking rewards</li>
                              <li>- Convert it to a {`"Vault"`} and top-up extra, for more rewards</li>
                            </ul>
                          </Text>
                          <Button colorScheme="teal" borderRadius="12px" variant="outline" size="lg" mt="5" onClick={() => navigate("/datanfts/unbonded")}>
                            <Text px={2}>Bond $ITHEUM on your NFMe ID</Text>
                          </Button>
                        </Box>
                      ) : (
                        <Box>
                          <Text fontWeight="bold">No NFMe ID yet?</Text>
                          <Text mt="1">Mint one now to:</Text>
                          <Text mt={2}>
                            <ul>
                              <li>- Get a cool, unique NFMe ID Data NFT Avatar</li>
                              <li>- Bond $ITHEUM tokens</li>
                              <li>- Build your Liveliness</li>
                              <li>- Earn awesome staking rewards</li>
                            </ul>
                          </Text>
                          <Button colorScheme="teal" borderRadius="12px" variant="outline" size="lg" mt="5" onClick={() => navigate("/NFMeID")}>
                            <Text px={2}>Get NFMe ID</Text>
                          </Button>
                        </Box>
                      )}
                    </Alert>
                  </>
                )}
              </>
            )}
          </VStack>
        </Box>
      </Flex>

      <Flex width="100%" flexWrap="wrap" gap={7} px={{ base: 0, md: 12 }} my={10}>
        <Heading fontSize="1.5rem" fontFamily="Clash-Medium" color="teal.200" textAlign={{ base: "center", md: "left" }}>
          Your NFMe ID Liveliness Bonds
        </Heading>

        {allInfoLoading ? (
          <Flex w="100%" h="20rem" justifyContent="center" alignItems="center">
            <Spinner size="md" color="teal.200" />
          </Flex>
        ) : !numberOfBonds ? (
          <NoDataHere imgFromTop="2" />
        ) : (
          bonds
            ?.slice()
            .sort((a, b) => {
              // Check if either bond has the specified vaultBondId and prioritize it as top 1
              // Replace with your actual vaultBondId variable
              if (a.bondId === vaultBondId) return -1; // `a` is prioritized to top if it matches vaultBondId
              if (b.bondId === vaultBondId) return 1; // `b` is prioritized if it matches vaultBondId

              // Sort by state, with bonds having state = 1 coming first
              if (a.state === 1 && b.state !== 1) return -1;
              if (b.state === 1 && a.state !== 1) return 1;

              // Sort remaining by bondId, newest ones on top
              if (a.bondId > b.bondId) return -1;
              if (a.bondId < b.bondId) return 1;

              // Otherwise, maintain the existing order
              return 0;
            })
            .map((currentBond, index) => {
              const dataNft = allDataNfts?.find((_dataNft) => currentBond.assetId.toString() === _dataNft.id);
              if (!dataNft) {
                return null;
              }

              const metadata = dataNft.content.metadata;

              return (
                <Card
                  _disabled={{ cursor: "not-allowed", opacity: "0.7" }}
                  key={index}
                  bg={colorMode === "dark" ? "#1b1b1b50" : "white"}
                  border=".1rem solid"
                  borderColor="#00C79740"
                  borderRadius="3xl"
                  p={5}
                  w="100%"
                  aria-disabled={currentBond.state === 0}>
                  <Flex gap={5} flexDirection={{ base: "column", md: "row" }}>
                    <Box minW="250px" textAlign="center">
                      <Box>
                        <NftMediaComponent getImgsFromNftMetadataContent={dataNft.content} imageHeight="160px" imageWidth="160px" borderRadius="10px" />
                      </Box>
                      <Flex pt={3} flexDirection={"column"} alignItems="center" w="100%">
                        <Button
                          w={"100%"}
                          colorScheme="teal"
                          px={6}
                          isDisabled={currentBond.state == 0 || !userPublicKey || hasPendingTransaction}
                          onClick={() => {
                            renewBondSol(currentBond?.bondId ?? 0);
                          }}>
                          Renew Bond
                        </Button>
                        <Text
                          mt={1}
                          fontSize=".75rem">{`Your new expiry will be ${calculateNewPeriodAfterNewBond(bondConfigData?.lockPeriod.toNumber())}`}</Text>
                      </Flex>
                      <Flex gap={4} pt={3} flexDirection={"column"} w="100%" alignItems="center">
                        <Flex flexDirection={{ base: "column" }} gap={2} pt={3} alignItems="center" w="100%">
                          {!checkIfBondIsExpired(currentBond?.unbondTimestamp) ? (
                            <Button
                              w="100%"
                              colorScheme="red"
                              variant="outline"
                              textColor="indianred"
                              fontWeight="400"
                              isDisabled={currentBond.state == 0 || !userPublicKey || hasPendingTransaction}
                              onClick={() => {
                                setWithdrawBondConfirmationWorkflow({
                                  bondId: currentBond.bondId,
                                  bondAmount: currentBond.bondAmount.toNumber() / 10 ** 9,
                                  bondExpired: false,
                                });
                              }}>
                              Withdraw Bond
                            </Button>
                          ) : (
                            <Button
                              w="100%"
                              colorScheme="teal"
                              variant="outline"
                              textColor="teal.200"
                              fontWeight="400"
                              isDisabled={currentBond.state === 0 || hasPendingTransaction}
                              onClick={() => {
                                setWithdrawBondConfirmationWorkflow({
                                  bondId: currentBond.bondId,
                                  bondAmount: currentBond.bondAmount.toNumber() / 10 ** 9,
                                  bondExpired: true,
                                });
                              }}>
                              Withdraw Bond
                            </Button>
                          )}
                          <Text fontSize="1rem" textColor="teal.200">
                            {formatNumberToShort(new BN(currentBond?.bondAmount ?? 0).div(BN10_9).toNumber())}
                            &nbsp;$ITHEUM Bonded
                          </Text>
                          <Box w="100%" position="relative">
                            {currentBond.bondId !== vaultBondId ? (
                              <>
                                {deepLinkHlSection === "makevault" && <FocusOnThisEffect top="-10px" />}
                                <Button
                                  colorScheme="blue"
                                  variant="outline"
                                  mt={2}
                                  w="100%"
                                  isDisabled={currentBond.state === 0 || hasPendingTransaction}
                                  onClick={() => {
                                    updateVaultBond(currentBond.bondId, dataNft.compression.leaf_id);
                                  }}>
                                  Set as NFMe ID Vault
                                </Button>
                              </>
                            ) : (
                              <Box fontSize="lg" w="80%" m="auto" mt="2">
                                ✅ Currently set as your NFMe ID Vault
                              </Box>
                            )}
                          </Box>
                          <Box id="section-makevault" />
                        </Flex>
                      </Flex>{" "}
                    </Box>
                    <Flex p={0} ml={{ md: "3" }} flexDirection="column" alignItems="start" w="full">
                      <Flex flexDirection="column" w="100%">
                        <Text fontFamily="Clash-Medium">{metadata.name}</Text>
                        <Link isExternal href={`${SOLSCAN_EXPLORER_URL}token/${dataNft.id}?cluster=${networkConfiguration}`}>
                          <Text fontSize="sm" pb={3}>
                            {`${dataNft.id.substring(0, 6)}...${dataNft.id.substring(dataNft.id.length - 6)}`}
                            <ExternalLinkIcon marginLeft={3} marginBottom={1} />
                          </Text>
                        </Link>
                        <Text fontSize="lg" pb={3}>
                          {`Bond ID: ${currentBond.bondId}`}
                        </Text>
                      </Flex>
                      {currentBond.state !== 0 && (
                        <Box w="100%">
                          <LivelinessContainer bond={currentBond} />
                        </Box>
                      )}
                    </Flex>
                    {currentBond.state === 0 && (
                      <Box
                        position="absolute"
                        top="0"
                        left="0"
                        width="100%"
                        height="100%"
                        bg={"rgba(202, 0, 0, 0.05)"}
                        zIndex="11"
                        opacity="0.9"
                        pointerEvents="none"
                        borderRadius="inherit"
                        display="flex"
                        alignItems="center"
                        justifyContent="center">
                        <Text fontSize="3xl" mt={2} fontWeight="bold" color="red.500">
                          INACTIVE
                        </Text>
                      </Box>
                    )}
                  </Flex>
                </Card>
              );
            })
        )}
      </Flex>

      {/* Confirmation Dialogs for actions that need explanation */}
      <>
        {/* Claim Rewards Dialog */}
        <ConfirmationDialog
          isOpen={claimRewardsConfirmationWorkflow}
          onCancel={() => {
            setClaimRewardsConfirmationWorkflow(false);
          }}
          onProceed={() => {
            handleClaimRewardsClick(vaultBondId!);
            setClaimRewardsConfirmationWorkflow(false);
          }}
          bodyContent={
            <>
              <Text mb="5">To get Max Accumulated Rewards, your Vault Liveliness must be over 95%. Yours is currently {vaultLiveliness}%</Text>
              <Text mt="5">To boost Vault Liveliness, renew the bond on each Data NFT before claiming</Text>
              <Text mt="5">Cancel to renew bonds first, or proceed if {`you're`} okay with lower rewards.</Text>
            </>
          }
          dialogData={{
            title: "Get Max Rewards if Vault Liveliness > 95%",
            proceedBtnTxt: "Proceed with Claim Rewards",
            cancelBtnText: "Cancel and Close",
          }}
        />

        {/* Reinvest Rewards Dialog */}
        <ConfirmationDialog
          isOpen={reinvestRewardsConfirmationWorkflow}
          onCancel={() => {
            setReinvestRewardsConfirmationWorkflow(false);
          }}
          onProceed={() => {
            handleReinvestRewardsClick(vaultBondId!);
            setReinvestRewardsConfirmationWorkflow(false);
          }}
          bodyContent={
            <>
              <Text fontWeight={"bold"} fontSize={"xl"} color={"teal.200"}>
                The reinvested amount will be added to your {`"NFMe ID Vault"`} bond and it will also renew the bond.
              </Text>{" "}
              <Text mt={1} fontSize=".75rem">{`New expiry will be ${calculateNewPeriodAfterNewBond(bondConfigData?.lockPeriod.toNumber())}`}</Text>
              {vaultLiveliness <= 95 && (
                <>
                  <Text mb="3" fontWeight={"bold"} fontSize={"lg"} mt="7">
                    Get Max Rewards if Vault Liveliness {`>`} 95%
                  </Text>
                  <Text mb="5">To reinvest Max Accumulated Rewards, your Vault Liveliness must be over 95%. Yours is currently {vaultLiveliness}%</Text>
                  <Text mt="5">To boost Vault Liveliness, renew the bond on each Data NFT before reinvesting.</Text>
                  <Text mt="5">Cancel to renew bonds first, or proceed if {`you're`} okay with lower rewards.</Text>
                </>
              )}
            </>
          }
          dialogData={{
            title: "Reinvest Rewards",
            proceedBtnTxt: "Proceed with Reinvest Rewards",
            cancelBtnText: "Cancel and Close",
          }}
        />

        {/* Withdraw Bond Dialog */}
        <>
          <ConfirmationDialog
            isOpen={withdrawBondConfirmationWorkflow != undefined}
            onCancel={() => {
              setWithdrawBondConfirmationWorkflow(undefined);
            }}
            onProceed={() => {
              handleWithdrawBondClick(
                withdrawBondConfirmationWorkflow!.bondId!,
                withdrawBondConfirmationWorkflow!.bondExpired
                  ? withdrawBondConfirmationWorkflow!.bondAmount
                  : (withdrawBondConfirmationWorkflow!.bondAmount * (100 - withdrawPenalty)) / 100
              );
              setWithdrawBondConfirmationWorkflow(undefined);
            }}
            bodyContent={
              <>
                <Text fontSize="sm" pb={3} opacity=".8">
                  {`Collection: ${withdrawBondConfirmationWorkflow?.bondId},   Bond Amount: ${withdrawBondConfirmationWorkflow?.bondAmount}`}
                </Text>
                {(!withdrawBondConfirmationWorkflow?.bondExpired && (
                  <Text color="indianred" fontWeight="bold" fontSize="lg" pb={3} opacity="1">
                    {`Amount receivable after penalty: ${(
                      (withdrawBondConfirmationWorkflow?.bondAmount ?? 0) -
                      ((withdrawBondConfirmationWorkflow?.bondAmount ?? 0) * withdrawPenalty) / 100
                    ).toFixed(2)}`}
                  </Text>
                )) || (
                  <Text color="teal.200" fontWeight="bold" fontSize="lg" pb={3} opacity="1">
                    As your bond has expired, so you can withdraw without any penalty.
                  </Text>
                )}
                <Text mb="2">There are a few items to consider before you proceed with the bond withdraw:</Text>
                <UnorderedList p="2">
                  {!withdrawBondConfirmationWorkflow?.bondExpired && (
                    <ListItem>
                      Withdrawing before bond expiry incurs a penalty of{" "}
                      <Text as="span" fontSize="md" color="indianred">
                        {withdrawPenalty}%
                      </Text>
                      ; no penalty after expiry, and you get the full amount back.
                    </ListItem>
                  )}
                  {!withdrawBondConfirmationWorkflow?.bondExpired && <ListItem>Penalties are non-refundable.</ListItem>}
                  <ListItem>After withdrawal, your Liveliness score drops to zero, visible to buyers if your Data NFT is listed.</ListItem>
                  <ListItem>Once withdrawn, you {`can't `}re-bond to regain the Liveliness score or earn staking rewards on this Data NFT again.</ListItem>
                </UnorderedList>

                <Text mt="5">With the above in mind, are your SURE you want to proceed and Withdraw Bond?</Text>
              </>
            }
            dialogData={{
              title: "Are you sure you want to Withdraw Bond?",
              proceedBtnTxt: "Proceed with Withdraw Bond",
              cancelBtnText: "Cancel and Close",
              proceedBtnColorScheme: "red",
            }}
          />
        </>
      </>
    </Flex>
  );
};
