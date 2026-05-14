/**
 * useScrollTo — cross-platform scroll-to-section helper.
 * On web: uses document.getElementById + scrollIntoView.
 * On native: consumed via ScrollContext (see ScrollContext.tsx).
 */
import React, { createContext, useContext } from 'react';
import { Platform } from 'react-native';

export type ScrollToFn = (id: string) => void;

export const ScrollContext = createContext<ScrollToFn>(() => {});

export function useScrollTo(): ScrollToFn {
  const ctxFn = useContext(ScrollContext);

  if (Platform.OS === 'web') {
    return (id: string) => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };
  }

  return ctxFn;
}
