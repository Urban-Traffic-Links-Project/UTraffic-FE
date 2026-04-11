import { create } from "zustand";

export const useCorrelationStore = create((set) => ({
  selectedSegmentId: "",
  setSelectedSegmentId: (selectedSegmentId) => set({ selectedSegmentId }),
}));