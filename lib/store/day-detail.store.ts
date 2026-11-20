import { create } from 'zustand';

// The day-detail table's expanded/collapsed choice. Kept in memory only, so
// it lasts for the session (across days and back-and-forth) and starts
// collapsed again on the next launch.
interface DayDetailState {
  tableExpanded: boolean;
  setTableExpanded: (expanded: boolean) => void;
}

export const useDayDetailStore = create<DayDetailState>(set => ({
  tableExpanded: false,
  setTableExpanded: tableExpanded => set({ tableExpanded }),
}));
