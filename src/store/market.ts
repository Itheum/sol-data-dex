import { create } from "zustand";

type State = {
  itheumPrice: number;
};

type Action = {
  updateItheumPrice: (itheumPrice: State["itheumPrice"]) => void;
};

export const useMarketStore = create<State & Action>((set) => ({
  itheumPrice: 0,
  updateItheumPrice: (value: number) => set((state) => ({ ...state, itheumPrice: value })),
}));
