/**
 * ScrollContext — provides a scrollToSection(id) that works on both
 * web (scrollIntoView) and native (ScrollView.scrollTo via Y positions)
 */
import React, { createContext, useContext } from 'react';

export type ScrollToFn = (id: string) => void;

export const ScrollContext = createContext<ScrollToFn>(() => {});

export function useScrollTo() {
  return useContext(ScrollContext);
}
