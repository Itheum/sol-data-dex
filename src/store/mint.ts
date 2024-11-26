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
  usersNfMeIdVaultBond: Bond | undefined;
  currentMaxApr: number;
};

type Action = {
  updateUserData: (userData: State["userData"]) => void;
  updateLockPeriodForBond: (userData: State["lockPeriodForBond"]) => void;
  updateUserBonds: (userBonds: State["userBonds"]) => void;
  updateUsersNfMeIdVaultBond: (usersNfMeIdVaultBond: State["usersNfMeIdVaultBond"]) => void;
  updateCurrentMaxApr: (currentMaxApr: State["currentMaxApr"]) => void;
};

export const useMintStore = create<State & Action>((set) => ({
  userData: undefined,
  lockPeriodForBond: [],
  userBonds: [],
  usersNfMeIdVaultBond: undefined,
  currentMaxApr: -1,
  updateUserData: (value: UserDataType | undefined) => set(() => ({ userData: value })),
  updateLockPeriodForBond: (value: Array<{ lockPeriod: number; amount: BigNumber.Value }>) => set(() => ({ lockPeriodForBond: value })),
  updateUserBonds: (value: Bond[]) => set(() => ({ userBonds: value })),
  updateUsersNfMeIdVaultBond: (value: Bond | undefined) => set(() => ({ usersNfMeIdVaultBond: value })),
  updateCurrentMaxApr: (value: number) => set(() => ({ currentMaxApr: value })),
}));
