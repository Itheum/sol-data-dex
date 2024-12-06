import React, { PropsWithChildren, useEffect } from "react";
import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { getItheumPriceFromApi } from "libs/Bespoke/api";
import { IS_DEVNET } from "libs/config";
import {
  fetchBondingConfigSol,
  fetchRewardsConfigSol,
  fetchSolNfts,
  fetchAddressBondsRewards,
  getBondingProgramInterface,
  retrieveBondsAndNftMeIdVault,
  getItheumBalanceOnSolana,
  fetchUserBadges,
} from "libs/Solana/utils";
import { computeRemainingCooldown } from "libs/utils";
import { sleep } from "libs/utils/util";
import { viewDataToOnlyGetReadOnlyBitz } from "pages/GetBitz/GetBitzSol";
import { useAccountStore, useMintStore } from "store";
import { useNftsStore } from "./nfts";

export const StoreProvider = ({ children }: PropsWithChildren) => {
  const { publicKey: userPublicKey } = useWallet();
  const { connection } = useConnection();

  // STOREs
  const {
    solPreaccessNonce,
    solPreaccessSignature,
    updateItheumPrice,
    updateItheumBalance,
    updateIsKeyChainDataForAppLoading,
    updateBitzBalance,
    updateGivenBitzSum,
    updateBonusBitzSum,
    updateCooldown,
    updateUserBadges,
  } = useAccountStore();
  const { updateAllDataNfts, updateBondedDataNftIds, updateBitzDataNfts, bitzDataNfts, allDataNfts } = useNftsStore();
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
        const itheumTokens = await getItheumBalanceOnSolana(connection, userPublicKey);
        if (itheumTokens != undefined) {
          updateItheumBalance(itheumTokens);
        } else {
          updateItheumBalance(-1);
        }
      })();

      // get users Data nfts
      const _allDataNfts: DasApiAsset[] = await fetchSolNfts(userPublicKey?.toBase58());

      updateAllDataNfts(_allDataNfts);

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

      // get users badges
      const _userBadges: any[] = await fetchUserBadges(userPublicKey?.toBase58());
      updateUserBadges(_userBadges);

      await sleep(3);

      updateIsKeyChainDataForAppLoading(false);
    })();
  }, [userPublicKey]);

  // if someone updates data nfts (i.e. at the start when app loads and we get nfts OR they get a free mint during app session), we go over them and find bitz nfts etc
  useEffect(() => {
    if (!userPublicKey || allDataNfts.length === 0) {
      return;
    }

    (async () => {
      updateIsKeyChainDataForAppLoading(true);

      // get users bitz data nfts
      const _bitzDataNfts: DasApiAsset[] = IS_DEVNET
        ? allDataNfts.filter((nft) => nft.content.metadata.name.includes("XP"))
        : allDataNfts.filter((nft) => nft.content.metadata.name.includes("IXPG")); // @TODO, what is the user has multiple BiTz? IXPG2 was from drip and IXPG3 will be from us direct via the airdrop

      updateBitzDataNfts(_bitzDataNfts);

      await sleep(3);

      updateIsKeyChainDataForAppLoading(false);
    })();
  }, [userPublicKey, allDataNfts]);

  // SOL - Bitz Bootstrap
  useEffect(() => {
    (async () => {
      resetBitzValsToLoadingSOL();

      if (bitzDataNfts.length > 0 && solPreaccessNonce !== "" && solPreaccessSignature !== "" && userPublicKey) {
        const viewDataArgs = {
          headers: {
            "dmf-custom-only-state": "1",
            "dmf-custom-sol-collection-id": bitzDataNfts[0].grouping[0].group_value,
          },
          fwdHeaderKeys: ["dmf-custom-only-state", "dmf-custom-sol-collection-id"],
        };

        const getBitzGameResult = await viewDataToOnlyGetReadOnlyBitz(bitzDataNfts[0], solPreaccessNonce, solPreaccessSignature, userPublicKey, viewDataArgs);

        if (getBitzGameResult) {
          let bitzBeforePlay = getBitzGameResult.data.gamePlayResult.bitsScoreBeforePlay || 0; // first play: 0
          let sumGivenBits = getBitzGameResult.data?.bitsMain?.bitsGivenSum || 0; // first play: -1
          let sumBonusBitz = getBitzGameResult.data?.bitsMain?.bitsBonusSum || 0; // first play: 0

          // some values can be -1 during first play or other situations, so we make it 0 or else we get weird numbers like 1 for the some coming up
          if (bitzBeforePlay < 0) {
            bitzBeforePlay = 0;
          }

          if (sumGivenBits < 0) {
            sumGivenBits = 0;
          }

          if (sumBonusBitz < 0) {
            sumBonusBitz = 0;
          }

          updateBitzBalance(bitzBeforePlay + sumBonusBitz - sumGivenBits); // collected bits - given bits
          updateGivenBitzSum(sumGivenBits); // given bits -- for power-ups
          updateBonusBitzSum(sumBonusBitz);

          updateCooldown(
            computeRemainingCooldown(
              getBitzGameResult.data.gamePlayResult.lastPlayedBeforeThisPlay,
              getBitzGameResult.data.gamePlayResult.configCanPlayEveryMSecs
            )
          );
        }
      } else {
        resetBitzValsToZeroSOL();
      }
    })();
  }, [userPublicKey, bitzDataNfts, solPreaccessNonce, solPreaccessSignature]);

  function resetBitzValsToZeroSOL() {
    updateBitzBalance(-1);
    updateGivenBitzSum(-1);
    updateCooldown(-1);
    updateBonusBitzSum(-1);
  }

  function resetBitzValsToLoadingSOL() {
    updateBitzBalance(-2);
    updateGivenBitzSum(-2);
    updateCooldown(-2);
    updateBonusBitzSum(-2);
  }

  const getItheumPrice = () => {
    (async () => {
      const _itheumPrice = (await getItheumPriceFromApi()) ?? 0;
      updateItheumPrice(_itheumPrice);
    })();
  };

  return <>{children}</>;
};
