import { DasApiAsset } from "@metaplex-foundation/digital-asset-standard-api";
import { create } from "zustand";

type State = {
  solNfts: DasApiAsset[];
  bondedNftIds: string[];
  isLoadingSol: boolean;
};

type Action = {
  updateSolNfts: (solNfts: State["solNfts"]) => void;
  updateBondedNftIds: (bondedNftIds: State["bondedNftIds"]) => void;
  updateIsLoadingSol: (isLoading: boolean) => void;
};

export const useNftsStore = create<State & Action>((set) => ({
  solNfts: [],
  updateSolNfts: (value: DasApiAsset[]) => set(() => ({ solNfts: value })),
  bondedNftIds: [],
  updateBondedNftIds: (value: string[]) => set(() => ({ bondedNftIds: value })),
  isLoadingSol: false,
  updateIsLoadingSol: (value: boolean) => set(() => ({ isLoadingSol: value })),
}));
