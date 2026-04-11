import { create } from "zustand";

const toIso = (d) => d.toISOString().slice(0, 10);

export const useTrafficDataStore = create((set) => ({
  search: "",
  selectedDate: toIso(new Date()),
  selectedSegmentId: "",

  setSearch: (search) => set({ search }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setSelectedSegmentId: (selectedSegmentId) => set({ selectedSegmentId }),
}));