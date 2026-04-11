import { create } from "zustand";

export const usePredictStore = create((set) => ({
  selectedSegmentId: "",
  setSelectedSegmentId: (selectedSegmentId) => set({ selectedSegmentId }),
}));