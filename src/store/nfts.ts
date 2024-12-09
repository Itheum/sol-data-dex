import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { create } from "zustand";

/*
This store holds things related to the users data nft collections
*/

type State = {
  allDataNfts: DasApiAsset[];
  bondedDataNftIds: string[];
  bitzDataNfts: DasApiAsset[];
  userHasG2BiTzNft: boolean;
};

type Action = {
  updateAllDataNfts: (allDataNfts: State["allDataNfts"]) => void;
  updateBondedDataNftIds: (bondedDataNftIds: State["bondedDataNftIds"]) => void;
  updateBitzDataNfts: (bitzDataNfts: State["bitzDataNfts"]) => void;
  updateUserHasG2BiTzNft: (userHasG2BiTzNft: State["userHasG2BiTzNft"]) => void;
};

export const useNftsStore = create<State & Action>((set) => ({
  allDataNfts: [],
  bondedDataNftIds: [],
  bitzDataNfts: [],
  userHasG2BiTzNft: false,
  updateAllDataNfts: (value: DasApiAsset[]) => set(() => ({ allDataNfts: value })),
  updateBondedDataNftIds: (value: string[]) => set(() => ({ bondedDataNftIds: value })),
  updateBitzDataNfts: (value: DasApiAsset[]) => set(() => ({ bitzDataNfts: value })),
  updateUserHasG2BiTzNft: (value: boolean) => set(() => ({ userHasG2BiTzNft: value })),
}));
