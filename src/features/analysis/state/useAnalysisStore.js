import { create } from "zustand";

const today = new Date();
const toIso = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

export const useAnalysisStore = create((set) => ({
  filters: {
    metric: "flow",
    method: "pearson",
    from: toIso(daysAgo(7)),
    to: toIso(today),
    threshold: 0.6,
    topN: 20,
  },

  viewMode: "graph", // "graph" | "map" (map is placeholder)
  selectedNodeId: null,
  selectedPair: null, // {source, target}

  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  setViewMode: (mode) => set({ viewMode: mode }),
  selectNode: (nodeId) => set({ selectedNodeId: nodeId, selectedPair: null }),
  selectPair: (pair) => set({ selectedPair: pair, selectedNodeId: null }),
  clearSelection: () => set({ selectedNodeId: null, selectedPair: null }),
}));
