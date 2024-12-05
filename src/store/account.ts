import { create } from "zustand";

/*
This store holds things related to the user account and app experience (itheum price, is the minimum data ready etc)
*/

type State = {
  itheumPrice: number;
  itheumBalance: number;
  accessToken: string;
  favoriteNfts: Array<string>;
  bitzBalance: number;
  givenBitzSum: number;
  bonusBitzSum: number;
  cooldown: number;
  collectedBitzSum: number;
  bonusTries: number;
  solPreaccessNonce: string;
  solPreaccessSignature: string;
  solPreaccessTimestamp: number;
  keyChainDataForAppLoading: boolean;
  userBadges: any[];
};

type Action = {
  updateItheumPrice: (itheumPrice: State["itheumPrice"]) => void;
  updateItheumBalance: (itheumBalance: State["itheumBalance"]) => void;
  updateAccessToken: (accessToken: State["accessToken"]) => void;
  updateFavoriteNfts: (favoriteNfts: State["favoriteNfts"]) => void;
  updateBitzBalance: (bitzBalance: State["bitzBalance"]) => void;
  updateCooldown: (cooldown: State["cooldown"]) => void;
  updateGivenBitzSum: (givenBitzSum: State["givenBitzSum"]) => void;
  updateCollectedBitzSum: (collectedBitzSum: State["collectedBitzSum"]) => void;
  updateBonusBitzSum: (bonusBitzSum: State["bonusBitzSum"]) => void;
  updateBonusTries: (bonusTries: State["bonusTries"]) => void;
  updateSolPreaccessNonce: (solPreaccessNonce: State["solPreaccessNonce"]) => void;
  updateSolSignedPreaccess: (solSignedPreaccess: State["solPreaccessSignature"]) => void;
  updateSolPreaccessTimestamp: (solPreaccessTimestamp: State["solPreaccessTimestamp"]) => void;
  // we should set this below value to true and false anywhere in the app, were we get on-chain data
  updateIsKeyChainDataForAppLoading: (isLoading: boolean) => void;
  updateUserBadges: (userBadges: State["userBadges"]) => void;
};

export const useAccountStore = create<State & Action>((set) => ({
  itheumPrice: 0,
  itheumBalance: 0,
  accessToken: "",
  favoriteNfts: [],
  bitzBalance: -2,
  cooldown: -2,
  givenBitzSum: -2,
  collectedBitzSum: -2,
  bonusBitzSum: -2,
  bonusTries: -2,
  solPreaccessNonce: "",
  solPreaccessSignature: "",
  solPreaccessTimestamp: -2,
  keyChainDataForAppLoading: false,
  userBadges: [],
  updateItheumPrice: (value: number) => set((state) => ({ ...state, itheumPrice: value })),
  updateItheumBalance: (value: number) => set(() => ({ itheumBalance: value })),
  updateAccessToken: (value: string) => set(() => ({ accessToken: value })),
  updateFavoriteNfts: (value: Array<string>) => set(() => ({ favoriteNfts: value })),
  updateBitzBalance: (value: number) => set(() => ({ bitzBalance: value })),
  updateCooldown: (value: number) => set(() => ({ cooldown: value })),
  updateGivenBitzSum: (value: number) => set(() => ({ givenBitzSum: value })),
  updateCollectedBitzSum: (value: number) => set(() => ({ collectedBitzSum: value })),
  updateBonusBitzSum: (value: number) => set(() => ({ bonusBitzSum: value })),
  updateBonusTries: (value: number) => set(() => ({ bonusTries: value })),
  updateSolPreaccessNonce: (value: string) => set(() => ({ solPreaccessNonce: value })),
  updateSolSignedPreaccess: (value: string) => set(() => ({ solPreaccessSignature: value })),
  updateSolPreaccessTimestamp: (value: number) => set(() => ({ solPreaccessTimestamp: value })),
  updateIsKeyChainDataForAppLoading: (value: boolean) => set(() => ({ keyChainDataForAppLoading: value })),
  updateUserBadges: (value: any[]) => set(() => ({ userBadges: value })),
}));
