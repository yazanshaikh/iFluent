import { create } from 'zustand';
import type { OpenSeaLead } from '@/api/openSea';

interface OpenSeaState {
  reassignTarget:    OpenSeaLead | null;
  setReassignTarget: (lead: OpenSeaLead | null) => void;
}

export const useOpenSeaStore = create<OpenSeaState>((set) => ({
  reassignTarget:    null,
  setReassignTarget: (lead) => set({ reassignTarget: lead }),
}));
