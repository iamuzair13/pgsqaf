import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarOpen: boolean;
  activeProgramId: string | null;
  activeAppraisalId: string | null;
  setSidebarOpen: (open: boolean) => void;
  setActiveProgramId: (id: string | null) => void;
  setActiveAppraisalId: (id: string | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      activeProgramId: null,
      activeAppraisalId: null,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setActiveProgramId: (id) => set({ activeProgramId: id }),
      setActiveAppraisalId: (id) => set({ activeAppraisalId: id }),
    }),
    { name: "pgsqaf-ui" }
  )
);

interface FilterState {
  appraisalFilters: Record<string, string>;
  programFilters: Record<string, string>;
  setAppraisalFilter: (key: string, value: string) => void;
  setProgramFilter: (key: string, value: string) => void;
  clearFilters: () => void;
}

export const useFilterStore = create<FilterState>()((set) => ({
  appraisalFilters: {},
  programFilters: {},
  setAppraisalFilter: (key, value) =>
    set((state) => ({
      appraisalFilters: { ...state.appraisalFilters, [key]: value },
    })),
  setProgramFilter: (key, value) =>
    set((state) => ({
      programFilters: { ...state.programFilters, [key]: value },
    })),
  clearFilters: () => set({ appraisalFilters: {}, programFilters: {} }),
}));
