/**
 * Guided tips for a student who hasn't subscribed yet: each tip shows once per
 * trial session until the student dismisses it (remembered on the device).
 */
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { profileApi } from '@/api/profile';
import { useAuthStore } from '@/stores/authStore';

export type GuideStep = 'my-sessions' | 'nearpod-code' | 'past-sessions' | 'activity';

/** False until we know the student has no active subscription. */
export function useIsTrialStudent(): boolean {
  const token = useAuthStore((s) => s.token);
  const { data } = useQuery({
    queryKey: ['trial-guide-profile'],
    queryFn:  profileApi.get,
    enabled:  !!token,
    staleTime: 60_000,
  });
  return data?.is_subscribed === false;
}

/** `trialKey` identifies the trial session; null means there's nothing to show. */
export function useGuideStep(step: GuideStep, trialKey: string | number | null) {
  const userId = useAuthStore((s) => s.user?.id);
  const [visible, setVisible] = useState(false);
  const storageKey = trialKey === null ? null : `trial-guide:${userId}:${step}:${trialKey}`;

  useEffect(() => {
    let alive = true;
    setVisible(false);
    if (!storageKey) return;
    AsyncStorage.getItem(storageKey)
      .then((seen) => { if (alive && !seen) setVisible(true); })
      .catch(() => {});
    return () => { alive = false; };
  }, [storageKey]);

  const dismiss = useCallback(() => {
    setVisible(false);
    if (storageKey) AsyncStorage.setItem(storageKey, '1').catch(() => {});
  }, [storageKey]);

  return { visible, dismiss };
}
