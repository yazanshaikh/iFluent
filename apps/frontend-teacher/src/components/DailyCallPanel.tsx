/**
 * Native Daily.co call, embedded in-app (no WebView / browser).
 * Shows the student (remote) full-bleed with the teacher (local) as a small PiP,
 * plus mic / camera toggles. Joins on mount, cleans up on unmount.
 *
 * NOTE: requires the native Daily/WebRTC modules — the dev client must be
 * rebuilt (expo run:android / eas build) after adding the SDK.
 */
import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Daily, { DailyMediaView } from '@daily-co/react-native-daily-js';

interface Props {
  roomUrl: string;
}

// The backend appends the meeting token as ?t=<token>. The native SDK does NOT
// auto-extract it from the URL, so split it out and pass it explicitly to
// join({ url, token }) — otherwise a private room rejects the join.
function parseRoomUrl(full: string): { url: string; token?: string } {
  const m = full.match(/[?&]t=([^&]+)/);
  const token = m ? decodeURIComponent(m[1]) : undefined;
  const url = full.replace(/[?&]t=[^&]+/, '').replace(/[?&]$/, '');
  return { url, token };
}

function videoTrack(p: any) {
  return p?.tracks?.video?.persistentTrack ?? p?.tracks?.video?.track ?? null;
}
function audioTrack(p: any) {
  return p?.tracks?.audio?.persistentTrack ?? p?.tracks?.audio?.track ?? null;
}

export function DailyCallPanel({ roomUrl }: Props) {
  const callRef = useRef<any>(null);
  const [participants, setParticipants] = useState<Record<string, any>>({});
  const [joined, setJoined] = useState(false);
  const [micOn,  setMicOn]  = useState(true);
  const [camOn,  setCamOn]  = useState(true);
  const [fatal,  setFatal]  = useState<string | null>(null);

  useEffect(() => {
    let call: any;
    try {
      call = Daily.createCallObject();
    } catch {
      setFatal('Video engine unavailable. Please rebuild the app.');
      return;
    }
    callRef.current = call;

    const sync = () => {
      try {
        const ps = call.participants();
        setParticipants({ ...ps });
        const local = ps.local;
        if (local) { setMicOn(!!local.audio); setCamOn(!!local.video); }
      } catch { /* ignore */ }
    };

    const { url, token } = parseRoomUrl(roomUrl);
    const room = url.split('/').pop();
    const diag = `room=${room} • token=${token ? 'YES(' + token.length + ')' : 'NONE'}`;

    call
      .on('joined-meeting', () => { setJoined(true); sync(); })
      .on('participant-joined',  sync)
      .on('participant-updated', sync)
      .on('participant-left',    sync)
      .on('left-meeting',        sync)
      .on('error', (ev: any) => {
        console.log('[Daily] error event', JSON.stringify(ev));
        const msg = ev?.errorMsg ?? ev?.error?.msg ?? 'Could not connect.';
        setFatal(`${msg}\n[${diag}]`);
      });

    console.log('[Daily] joining', diag);
    call.join(token ? { url, token } : { url }).catch((e: any) => {
      console.log('[Daily] join error', e?.message, JSON.stringify(e));
      setFatal(`${e?.message ?? 'Could not join.'}\n[${diag}]`);
    });

    return () => {
      try { call.leave().catch(() => {}); call.destroy().catch(() => {}); } catch { /* ignore */ }
      callRef.current = null;
    };
  }, [roomUrl]);

  const local  = participants.local;
  const remote = Object.values(participants).find((p: any) => !p.local) as any;

  const toggleMic = () => {
    if (!joined || !callRef.current) return;
    const next = !micOn; setMicOn(next);
    try { callRef.current.setLocalAudio(next); } catch { /* ignore */ }
  };
  const toggleCam = () => {
    if (!joined || !callRef.current) return;
    const next = !camOn; setCamOn(next);
    try { callRef.current.setLocalVideo(next); } catch { /* ignore */ }
  };

  return (
    <View style={s.wrap}>
      {remote && videoTrack(remote) ? (
        <DailyMediaView
          videoTrack={videoTrack(remote)}
          audioTrack={audioTrack(remote)}
          mirror={false}
          objectFit="cover"
          style={StyleSheet.absoluteFillObject}
        />
      ) : (
        <View style={s.placeholder}>
          {fatal ? (
            <>
              <Ionicons name="warning-outline" size={40} color="#f59e0b" />
              <Text style={s.placeholderTxt}>{fatal}</Text>
            </>
          ) : joined ? (
            <>
              <Ionicons name="person-circle-outline" size={44} color="#475569" />
              <Text style={s.placeholderTxt}>Waiting for the student to join…</Text>
            </>
          ) : (
            <>
              <ActivityIndicator color="#0ea5e9" size="large" />
              <Text style={s.placeholderTxt}>Connecting…</Text>
            </>
          )}
        </View>
      )}

      {local && camOn && videoTrack(local) && (
        <View style={s.pip}>
          <DailyMediaView
            videoTrack={videoTrack(local)}
            audioTrack={null}
            mirror
            objectFit="cover"
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      )}

      {joined && !fatal && (
        <View style={s.controls}>
          <TouchableOpacity style={[s.ctrlBtn, !micOn && s.ctrlBtnOff]} onPress={toggleMic}>
            <Ionicons name={micOn ? 'mic' : 'mic-off'} size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[s.ctrlBtn, !camOn && s.ctrlBtnOff]} onPress={toggleCam}>
            <Ionicons name={camOn ? 'videocam' : 'videocam-off'} size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0b1220', overflow: 'hidden' },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center', gap: 10, paddingHorizontal: 20,
  },
  placeholderTxt: { color: '#94a3b8', fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 19 },
  pip: {
    position: 'absolute', top: 8, left: 8,
    width: 84, height: 116, borderRadius: 12, overflow: 'hidden',
    backgroundColor: '#000', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
    zIndex: 5,
  },
  controls: {
    position: 'absolute', bottom: 8, alignSelf: 'center',
    flexDirection: 'row', gap: 12, zIndex: 6,
  },
  ctrlBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(15,23,42,0.85)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  ctrlBtnOff: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
});
