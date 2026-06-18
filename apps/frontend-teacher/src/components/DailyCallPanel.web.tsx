/**
 * Daily call panel — WEB / DESKTOP implementation.
 *
 * Metro resolves this on web instead of `DailyCallPanel.tsx`, so the RN Daily
 * SDK (and react-native-webrtc) never enter the web bundle. Uses the Daily Web
 * SDK's prebuilt call frame, which provides the full video/audio UI in-browser.
 *
 * Same export name + props as the native panel ({ roomUrl }) so callers are
 * platform-agnostic.
 */
import { useEffect, useRef } from 'react';
import DailyIframe, { type DailyCall } from '@daily-co/daily-js';

interface Props {
  roomUrl: string;
}

// Mirrors the native parser: the backend appends the meeting token as ?t=<token>.
function parseRoomUrl(full: string): { url: string; token?: string } {
  const m = full.match(/[?&]t=([^&]+)/);
  const token = m ? decodeURIComponent(m[1]) : undefined;
  const url = full.replace(/[?&]t=[^&]+/, '').replace(/[?&]$/, '');
  return { url, token };
}

export function DailyCallPanel({ roomUrl }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const callRef = useRef<DailyCall | null>(null);

  useEffect(() => {
    if (!containerRef.current || !roomUrl) return;

    const { url, token } = parseRoomUrl(roomUrl);

    const frame = DailyIframe.createFrame(containerRef.current, {
      showLeaveButton: true,
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: '0',
        borderRadius: '12px',
      },
    });
    callRef.current = frame;

    frame.join({ url, ...(token ? { token } : {}) }).catch((e) => {
      console.error('[DailyWeb] join failed', e);
    });

    return () => {
      callRef.current = null;
      frame.destroy().catch(() => {});
    };
  }, [roomUrl]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', minHeight: 320, backgroundColor: '#0a0a0a', borderRadius: 12 }}
    />
  );
}
