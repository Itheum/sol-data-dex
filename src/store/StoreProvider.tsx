import React, { PropsWithChildren, useEffect } from "react";
import { Program } from "@coral-xyz/anchor";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { getItheumPriceFromApi } from "libs/Bespoke/api";
import { BONDING_PROGRAM_ID } from "libs/Solana/config";
import { CoreSolBondStakeSc, IDL } from "libs/Solana/CoreSolBondStakeSc";
import { fetchBondingConfigSol, fetchSolNfts, ITHEUM_TOKEN_ADDRESS } from "libs/Solana/utils";
import { useAccountStore, useMarketStore, useMintStore } from "store";
import { useNftsStore } from "./nfts";

export const StoreProvider = ({ children }: PropsWithChildren) => {
  // SOLANA
  const { publicKey: solPubKey } = useWallet();
  const { connection } = useConnection();

  // ACCOUNT STORE
  const updateItheumBalance = useAccountStore((state) => state.updateItheumBalance);

  // MARKET STORE
  const updateItheumPrice = useMarketStore((state) => state.updateItheumPrice);

  // MINT STORE
  const updateLockPeriodForBond = useMintStore((state) => state.updateLockPeriodForBond);

  // NFT Store
  const { updateSolNfts, updateIsLoadingSol } = useNftsStore();

  useEffect(() => {
    if (!solPubKey) {
      return;
    }

    updateIsLoadingSol(true);

    (async () => {
      const itheumTokens = await getItheumBalanceOnSolana();
      if (itheumTokens != undefined) updateItheumBalance(itheumTokens);
      else updateItheumBalance(-1);
    })();

    fetchSolNfts(solPubKey?.toBase58()).then((nfts) => {
      updateSolNfts(nfts);
    });

    const programId = new PublicKey(BONDING_PROGRAM_ID);
    const program = new Program<CoreSolBondStakeSc>(IDL, programId, {
      connection,
    });

    fetchBondingConfigSol(program).then((periodsT: any) => {
      if (periodsT?.error) {
        updateLockPeriodForBond([]);
      } else {
        const lockPeriod: number = periodsT.lockPeriod;
        const amount: BigNumber.Value = periodsT.bondAmount;
        updateLockPeriodForBond([{ lockPeriod, amount }]);
      }
    });

    updateIsLoadingSol(false);
  }, [solPubKey]);

  const getItheumBalanceOnSolana = async () => {
    try {
      const itheumTokenMint = new PublicKey(ITHEUM_TOKEN_ADDRESS);
      const addressAta = getAssociatedTokenAddressSync(itheumTokenMint, solPubKey!, false);
      const balance = await connection.getTokenAccountBalance(addressAta);
      return balance.value.uiAmount;
    } catch (error) {
      console.error("Error fetching Itheum" + ITHEUM_TOKEN_ADDRESS + "  balance on Solana " + import.meta.env.VITE_ENV_NETWORK + " blockchain:", error);
      throw error;
    }
  };

  useEffect(() => {
    getItheumPrice();
    const interval = setInterval(() => {
      getItheumPrice();
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const getItheumPrice = () => {
    (async () => {
      const _itheumPrice = (await getItheumPriceFromApi()) ?? 0;
      updateItheumPrice(_itheumPrice);
    })();
  };

  return <>{children}</>;
};
