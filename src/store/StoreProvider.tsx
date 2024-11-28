import React, { PropsWithChildren, useEffect } from "react";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { getItheumPriceFromApi } from "libs/Bespoke/api";
import { IS_DEVNET } from "libs/config";
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
  const { updateAllDataNfts, updateBondedDataNftIds, updateBitzDataNfts } = useNftsStore();
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

      // get users Data nfts
      const _allDataNfts: DasApiAsset[] = await fetchSolNfts(userPublicKey?.toBase58());

      updateAllDataNfts(_allDataNfts);

      console.log("_allDataNfts", _allDataNfts);

      // get users bitz data nfts
      const _bitzDataNfts: DasApiAsset[] = IS_DEVNET
        ? _allDataNfts.filter((nft) => nft.content.metadata.name.includes("XP"))
        : _allDataNfts.filter((nft) => nft.content.metadata.name.includes("IXPG2"));

      console.log("_bitzDataNfts", _bitzDataNfts);

      updateBitzDataNfts(_bitzDataNfts);

      // S: get bonding / staking program config params
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
      // E: get bonding / staking program config params

      // S: get users bonds
      const addressBondsRewardsPda = PublicKey.findProgramAddressSync(
        [Buffer.from("address_bonds_rewards"), userPublicKey?.toBuffer()],
        programObj.programId
      )[0];

      const userBondsInfo = await fetchAddressBondsRewards(programObj.programInterface, addressBondsRewardsPda);

      if (userBondsInfo) {
        const numberOfBonds = userBondsInfo.currentIndex;

        updateUsersNfMeIdVaultBondId(userBondsInfo.vaultBondId);

        retrieveBondsAndNftMeIdVault(userPublicKey, numberOfBonds, programObj.programInterface).then(({ myBonds }) => {
          updateUserBonds(myBonds);
          updateBondedDataNftIds(myBonds.map((i) => i.assetId.toBase58()));
        });
      }
      // E: get users bonds

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
