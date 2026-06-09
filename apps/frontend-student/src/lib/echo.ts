/**
 * Real-time WebSocket for Laravel Reverb.
 * ✅ Uses React Native built-in WebSocket — zero native modules needed
 * ✅ Works in Expo Go without any native build
 */

const REVERB_HOST = process.env.EXPO_PUBLIC_REVERB_HOST    ?? '192.168.0.101';
const REVERB_PORT = process.env.EXPO_PUBLIC_REVERB_PORT    ?? '8080';
const REVERB_KEY  = process.env.EXPO_PUBLIC_REVERB_APP_KEY ?? 'cxar16zcqn1j6y4fbprx';
const API_BASE    = process.env.EXPO_PUBLIC_API_URL        ?? 'http://192.168.0.101:8000/api/v1';

type Listener = (data: any) => void;

let ws:       WebSocket | null = null;
let token:    string | null    = null;
// channel → event → Set<callback>
const listeners = new Map<string, Map<string, Set<Listener>>>();

// ─── connect ──────────────────────────────────────────────────────────────────
function connect(authToken: string) {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  const url = `ws://${REVERB_HOST}:${REVERB_PORT}/app/${REVERB_KEY}?protocol=7&client=js&version=8.0&flash=false`;
  ws    = new WebSocket(url);
  token = authToken;

  ws.onopen = () => {
    console.log('[ECHO] ✅ Connected to Reverb');
  };

  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data as string);

      // Handle Pusher protocol pings
      if (msg.event === 'pusher:ping') {
        ws?.send(JSON.stringify({ event: 'pusher:pong', data: {} }));
        return;
      }

      // Dispatch to listeners
      const channelListeners = listeners.get(msg.channel);
      if (!channelListeners) return;

      const eventListeners = channelListeners.get(msg.event);
      eventListeners?.forEach((cb) => {
        try {
          const data = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
          cb(data);
        } catch {
          cb(msg.data);
        }
      });
    } catch { /* ignore parse errors */ }
  };

  ws.onerror = () => { /* silent — connection refused when Reverb is off */ };

  ws.onclose = () => {
    ws = null;
    console.log('[ECHO] 🔌 Disconnected');
  };
}

// ─── subscribe to private channel ─────────────────────────────────────────────
async function subscribePrivate(channelName: string, authToken: string) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  try {
    const socketId = Math.random().toString(36).slice(2) + '.' + Math.random().toString(36).slice(2);
    const authUrl  = `${API_BASE.replace('/api/v1', '')}/broadcasting/auth`;

    const res = await fetch(authUrl, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${authToken}`,
        'Accept':        'application/json',
      },
      body: JSON.stringify({ socket_id: socketId, channel_name: channelName }),
    });

    const { auth } = await res.json();

    ws.send(JSON.stringify({
      event: 'pusher:subscribe',
      data:  { channel: channelName, auth },
    }));
  } catch { /* ignore auth errors — events won't arrive but no crash */ }
}

// ─── getEcho ──────────────────────────────────────────────────────────────────
export function getEcho(authToken: string) {
  if (!authToken?.trim()) throw new Error('[ECHO] Token missing');

  // Connect if not already
  connect(authToken);

  return {
    private: (channelName: string) => {
      // Ensure channel map exists
      if (!listeners.has(channelName)) {
        listeners.set(channelName, new Map());
      }

      // Subscribe after a short delay to let WS open
      setTimeout(() => subscribePrivate(channelName, authToken), 500);

      return {
        listen: (event: string, callback: Listener) => {
          const channelMap = listeners.get(channelName)!;
          if (!channelMap.has(event)) channelMap.set(event, new Set());
          channelMap.get(event)!.add(callback);

          return () => {
            channelMap.get(event)?.delete(callback);
          };
        },
      };
    },
  };
}

// ─── helpers ──────────────────────────────────────────────────────────────────
export function isEchoReady(): boolean {
  return ws !== null && ws.readyState === WebSocket.OPEN;
}

export function disconnectEcho(): void {
  ws?.close();
  ws = null;
  token = null;
  listeners.clear();
}
