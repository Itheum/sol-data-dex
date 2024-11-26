import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { create } from "zustand";

/*
This store holds things related to the users data nft collections
*/

type State = {
  allDataNfts: DasApiAsset[];
  bondedDataNftIds: string[];
};

type Action = {
  updateAllDataNfts: (allDataNfts: State["allDataNfts"]) => void;
  updateBondedDataNftIds: (bondedDataNftIds: State["bondedDataNftIds"]) => void;
};

export const useNftsStore = create<State & Action>((set) => ({
  allDataNfts: [],
  updateAllDataNfts: (value: DasApiAsset[]) => set(() => ({ allDataNfts: value })),
  bondedDataNftIds: [],
  updateBondedDataNftIds: (value: string[]) => set(() => ({ bondedDataNftIds: value })),
}));
