import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AvatarState {
  selectedAvatar: number | null;   // avatar id (1-8), null = show initial letter
  setAvatar: (id: number | null) => void;
}

export const useAvatarStore = create<AvatarState>()(
  persist(
    (set) => ({
      selectedAvatar: null,
      setAvatar: (id) => set({ selectedAvatar: id }),
    }),
    {
      name: 'avatar-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
