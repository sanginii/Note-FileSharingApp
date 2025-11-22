import { create } from 'zustand';

export type SecurityMode = 'strict' | 'warnings';

interface SecurityStore {
  mode: SecurityMode;
  setMode: (mode: SecurityMode) => void;
}

export const useSecurityStore = create<SecurityStore>((set) => ({
  mode: 'warnings',
  setMode: (mode) => set({ mode }),
}));


