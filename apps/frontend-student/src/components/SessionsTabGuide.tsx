/** Trial students: points at the "حصصي" tab once a trial session is booked. */
import { useQuery } from '@tanstack/react-query';
import { sessionsApi } from '@/api/sessions';
import { useGuideStep, useIsTrialStudent } from '@/lib/trialGuide';
import { GuideTip } from './GuideTip';

export function SessionsTabGuide({ bottom }: { bottom: number }) {
  const isTrial = useIsTrialStudent();

  const { data: sessions = [] } = useQuery({ queryKey: ['sessions'], queryFn: () => sessionsApi.listSessions(), enabled: isTrial });
  const { data: bookings = [] } = useQuery({ queryKey: ['bookings'], queryFn: () => sessionsApi.listBookings(), enabled: isTrial });

  // A booking becomes a session at the same time, so the time identifies the trial.
  const booked = bookings.find((b) => b.type === 'demo' && ['pending', 'confirmed'].includes(b.status) && !b.session_id)?.scheduled_at
    ?? sessions.find((s) => s.lesson?.is_assessment && ['waiting', 'active'].includes(s.status))?.scheduled_at
    ?? null;

  // Stays up on every tab until the student presses "حسناً", so it can't be missed.
  const { visible, dismiss } = useGuideStep('my-sessions', isTrial && booked ? new Date(booked).getTime() : null);

  if (!visible) return null;

  return (
    <GuideTip
      text="حصتك المحجوزة تجدها هنا في قسم «حصصي»."
      arrow="down"
      arrowSlot={{ index: 1, of: 4 }}
      onDismiss={dismiss}
      style={{ position: 'absolute', left: 8, right: 8, bottom: bottom + 2, zIndex: 50 }}
    />
  );
}
