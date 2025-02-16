import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import BigNumber from "bignumber.js";
import { create } from "zustand";
import { UserDataType } from "libs/Bespoke/types";
import { Bond } from "libs/Solana/types";

/*
This store holds things related to minting and bonding data nfts
*/

type State = {
  userData: UserDataType | undefined; // @TODO, we can add some Solana config here that controls how the mint form will work. It's not used now
  lockPeriodForBond: Array<{ lockPeriod: number; amount: BigNumber.Value }>;
  userBonds: Array<Bond>;
  usersNfMeIdVaultBondId: number;
  currentMaxApr: number;
  freeNfMeIdClaimed: boolean;
  nfmeIdDataNft: DasApiAsset | undefined;
};

type Action = {
  updateUserData: (userData: State["userData"]) => void;
  updateLockPeriodForBond: (userData: State["lockPeriodForBond"]) => void;
  updateUserBonds: (userBonds: State["userBonds"]) => void;
  updateUsersNfMeIdVaultBondId: (usersNfMeIdVaultBondId: State["usersNfMeIdVaultBondId"]) => void;
  updateCurrentMaxApr: (currentMaxApr: State["currentMaxApr"]) => void;
  updateFreeNfMeIdClaimed: (freeNfMeIdClaimed: State["freeNfMeIdClaimed"]) => void;
  updateNfmeIdDataNft: (nfmeIdDataNft: State["nfmeIdDataNft"]) => void;
};

export const useMintStore = create<State & Action>((set) => ({
  userData: undefined,
  lockPeriodForBond: [],
  userBonds: [],
  usersNfMeIdVaultBondId: 0,
  currentMaxApr: -1,
  freeNfMeIdClaimed: false,
  nfmeIdDataNft: undefined,
  updateUserData: (value: UserDataType | undefined) => set(() => ({ userData: value })),
  updateLockPeriodForBond: (value: Array<{ lockPeriod: number; amount: BigNumber.Value }>) => set(() => ({ lockPeriodForBond: value })),
  updateUserBonds: (value: Bond[]) => set(() => ({ userBonds: value })),
  updateUsersNfMeIdVaultBondId: (value: number) => set(() => ({ usersNfMeIdVaultBondId: value })),
  updateCurrentMaxApr: (value: number) => set(() => ({ currentMaxApr: value })),
  updateFreeNfMeIdClaimed: (value: boolean) => set(() => ({ freeNfMeIdClaimed: value })),
  updateNfmeIdDataNft: (value: DasApiAsset | undefined) => set(() => ({ nfmeIdDataNft: value })),
}));
