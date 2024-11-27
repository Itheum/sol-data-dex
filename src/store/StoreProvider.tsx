import React, { PropsWithChildren, useEffect } from "react";
import { Program } from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { getItheumPriceFromApi } from "libs/Bespoke/api";
// import { BONDING_PROGRAM_ID } from "libs/Solana/config";
// import { CoreSolBondStakeSc, IDL } from "libs/Solana/CoreSolBondStakeSc";
import {
  fetchBondingConfigSol,
  fetchRewardsConfigSol,
  fetchSolNfts,
  ITHEUM_SOL_TOKEN_ADDRESS,
  fetchAddressBondsRewards,
  getBondingProgramInterface,
  retrieveBondsAndNftMeIdVault,
} from "libs/Solana/utils";
import { sleep } from "libs/utils/util";
import { useAccountStore, useMintStore } from "store";
import { useNftsStore } from "./nfts";

export const StoreProvider = ({ children }: PropsWithChildren) => {
  const { publicKey: userPublicKey } = useWallet();
  const { connection } = useConnection();

  // STOREs
  const { updateItheumPrice, updateItheumBalance, updateIsKeyChainDataForAppLoading } = useAccountStore();
  // const updateLockPeriodForBond = useMintStore((state) => state.updateLockPeriodForBond);
  const { updateAllDataNfts, updateBondedDataNftIds } = useNftsStore();
  const { updateLockPeriodForBond, updateUserBonds, updateUsersNfMeIdVaultBondId, updateCurrentMaxApr } = useMintStore();

  useEffect(() => {
    getItheumPrice();
    const interval = setInterval(() => {
      getItheumPrice();
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  /*
  In this effect, we load all the on-chain items we need to bootstrap the user experience
  ... itheum token balance, data nfts, bonding config etc
  */
  useEffect(() => {
    if (!userPublicKey) {
      return;
    }

    (async () => {
      updateIsKeyChainDataForAppLoading(true);

      // get users sol ITHEUM Balance
      (async () => {
        const itheumTokens = await getItheumBalanceOnSolana();
        if (itheumTokens != undefined) updateItheumBalance(itheumTokens);
        else updateItheumBalance(-1);
      })();

      // get users Data NFTs
      fetchSolNfts(userPublicKey?.toBase58()).then((nfts) => {
        updateAllDataNfts(nfts);
      });

      // get bonding / staking program config params
      const programObj = getBondingProgramInterface(connection);

      fetchBondingConfigSol(programObj.programInterface).then((periodsT: any) => {
        if (periodsT?.error) {
          updateLockPeriodForBond([]);
        } else {
          const lockPeriod: number = periodsT.lockPeriod;
          const amount: BigNumber.Value = periodsT.bondAmount;
          updateLockPeriodForBond([{ lockPeriod, amount }]);
        }
      });

      fetchRewardsConfigSol(programObj.programInterface).then((rewardsT: any) => {
        if (rewardsT?.error) {
          updateCurrentMaxApr(-1);
        } else {
          updateCurrentMaxApr(rewardsT.maxApr);
        }
      });

      // S: get users bonds, and nfmeid value bond object
      // we need programSol, addressBondsRewardsPda, userPublicKey

      const addressBondsRewardsPda = PublicKey.findProgramAddressSync(
        [Buffer.from("address_bonds_rewards"), userPublicKey?.toBuffer()],
        programObj.programId
      )[0];

      // getNumberOfBonds for user

      const userBondsInfo = await fetchAddressBondsRewards(programObj.programInterface, addressBondsRewardsPda);

      console.log("userBondsInfo A");
      console.log(userBondsInfo);

      if (userBondsInfo) {
        console.log("userBondsInfo B");

        const numberOfBonds = userBondsInfo.currentIndex;

        updateUsersNfMeIdVaultBondId(userBondsInfo.vaultBondId);

        retrieveBondsAndNftMeIdVault(userPublicKey, numberOfBonds, programObj.programInterface).then(({ myBonds, nftMeIdVault }) => {
          console.log("userBondsInfo C");

          updateUserBonds(myBonds);
          updateBondedDataNftIds(myBonds.map((i) => i.assetId.toBase58()));

          // if (nftMeIdVault) {
          //   console.log("userBondsInfo D");
          //   updateUsersNfMeIdVaultBond(nftMeIdVault);
          // }
        });
      }
      // E: get users bonds, and nfmeid value bond object

      await sleep(3);

      updateIsKeyChainDataForAppLoading(false);
    })();
  }, [userPublicKey]);

  const getItheumBalanceOnSolana = async () => {
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

  const getItheumPrice = () => {
    (async () => {
      const _itheumPrice = (await getItheumPriceFromApi()) ?? 0;
      updateItheumPrice(_itheumPrice);
    })();
  };

  return <>{children}</>;
};
