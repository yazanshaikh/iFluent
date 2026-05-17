import { create } from 'zustand';
import type { OpenSeaLead } from '@/api/openSea';

interface OpenSeaState {
  /** الليد المحدد لعملية Re-assign */
  reassignTarget:    OpenSeaLead | null;
  setReassignTarget: (lead: OpenSeaLead | null) => void;

  /** الليد المحدد لتأكيد Pull */
  pullTarget:    OpenSeaLead | null;
  setPullTarget: (lead: OpenSeaLead | null) => void;
}

export const useOpenSeaStore = create<OpenSeaState>((set) => ({
  reassignTarget:    null,
  setReassignTarget: (lead) => set({ reassignTarget: lead }),

  pullTarget:    null,
  setPullTarget: (lead) => set({ pullTarget: lead }),
}));
