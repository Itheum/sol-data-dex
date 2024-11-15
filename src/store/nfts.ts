import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { create } from "zustand";

type State = {
  solNfts: DasApiAsset[];
  isLoadingSol: boolean;
};

type Action = {
  updateSolNfts: (solNfts: State["solNfts"]) => void;
  updateIsLoadingSol: (isLoading: boolean) => void;
};

export const useNftsStore = create<State & Action>((set) => ({
  solNfts: [],
  updateSolNfts: (value: DasApiAsset[]) => set(() => ({ solNfts: value })),
  isLoadingSol: false,
  updateIsLoadingSol: (value: boolean) => set(() => ({ isLoadingSol: value })),
}));
