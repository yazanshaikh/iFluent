/**
 * Native Daily.co call for GROUP classes: every participant in a grid.
 * The teacher joins with an owner token (?t=…) and gets moderation:
 * mute one participant (tap their tile) or mute everyone at once.
 * A muted student can unmute themselves again (Daily's rule).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, LogBox } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Daily, { DailyMediaView } from '@daily-co/react-native-daily-js';

// A normal end of the meeting is reported as an error by daily-js; don't red-box it.
LogBox.ignoreLogs(['Meeting ended in error', 'Meeting has ended']);

const TEXT = {
  engine: 'تعذّر تشغيل محرّك الفيديو. تأكد من تحديث التطبيق.',
  connect: 'تعذّر الاتصال بالحصة.',
  connecting: 'جاري الاتصال…',
  you: 'أنت', guest: 'ضيف', teacher: 'المعلم',
  mute: 'كتم', muteAll: 'كتم الجميع',
};

interface Props {
  roomUrl:     string;
  userName?:   string;
  /** Teacher: can mute participants. Needs the owner token in roomUrl. */
  moderator?:  boolean;
}

function parseRoomUrl(full: string): { url: string; token?: string } {
  const m = full.match(/[?&]t=([^&]+)/);
  const token = m ? decodeURIComponent(m[1]) : undefined;
  const url = full.replace(/[?&]t=[^&]+/, '').replace(/[?&]$/, '');
  return { url, token };
}

const videoTrack = (p: any) => p?.tracks?.video?.persistentTrack ?? p?.tracks?.video?.track ?? null;
const audioTrack = (p: any) => p?.tracks?.audio?.persistentTrack ?? p?.tracks?.audio?.track ?? null;

/** Columns for a readable grid at any class size. */
const columnsFor = (count: number) => (count <= 1 ? 1 : count <= 4 ? 2 : count <= 9 ? 3 : 4);

export function GroupCallPanel({ roomUrl, userName, moderator = false }: Props) {
  const callRef = useRef<any>(null);
  const [participants, setParticipants] = useState<Record<string, any>>({});
  const [joined, setJoined]     = useState(false);
  const [micOn, setMicOn]       = useState(true);
  const [camOn, setCamOn]       = useState(true);
  const [fatal, setFatal]       = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let call: any;
    try {
      call = Daily.createCallObject();
    } catch {
      setFatal(TEXT.engine);
      return;
    }
    callRef.current = call;

    const sync = () => {
      try {
        const ps = call.participants();
        setParticipants({ ...ps });
        if (ps.local) { setMicOn(!!ps.local.audio); setCamOn(!!ps.local.video); }
      } catch { /* ignore */ }
    };

    const { url, token } = parseRoomUrl(roomUrl);
    call
      .on('joined-meeting', () => { setJoined(true); sync(); })
      .on('participant-joined',  sync)
      .on('participant-updated', sync)
      .on('participant-left',    sync)
      .on('left-meeting',        sync)
      .on('error', (ev: any) => {
        const raw = String(ev?.errorMsg ?? ev?.error?.msg ?? '');
        if (/ended|has ended|left/i.test(raw)) return;
        setFatal(raw || TEXT.connect);
      });

    call.join({ url, ...(token ? { token } : {}), ...(userName ? { userName } : {}) })
      .catch((e: any) => setFatal(e?.message ?? TEXT.connect));

    return () => {
      try { call.leave().catch(() => {}); call.destroy().catch(() => {}); } catch { /* ignore */ }
      callRef.current = null;
    };
  }, [roomUrl, userName]);

  // Owner (teacher) first, then the local user, then everyone else by name.
  const people = useMemo(() => Object.values(participants).sort((a: any, b: any) =>
    Number(!!b.owner) - Number(!!a.owner)
    || Number(!!b.local) - Number(!!a.local)
    || String(a.user_name ?? '').localeCompare(String(b.user_name ?? ''))), [participants]) as any[];

  const columns = columnsFor(people.length);

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
  const mute = (sessionId: string) => {
    try { callRef.current?.updateParticipant(sessionId, { setAudio: false }); } catch { /* ignore */ }
    setSelected(null);
  };
  const muteAll = () => {
    try { callRef.current?.updateParticipants({ '*': { setAudio: false } }); } catch { /* ignore */ }
  };

  if (fatal) {
    return (
      <View style={[s.wrap, s.center]}>
        <Ionicons name="warning-outline" size={40} color="#f59e0b" />
        <Text style={s.info}>{fatal}</Text>
      </View>
    );
  }

  if (!joined) {
    return (
      <View style={[s.wrap, s.center]}>
        <ActivityIndicator color="#0ea5e9" size="large" />
        <Text style={s.info}>{TEXT.connecting}</Text>
      </View>
    );
  }

  return (
    <View style={s.wrap}>
      <ScrollView contentContainerStyle={s.grid}>
        {people.map((p) => {
          const video = videoTrack(p);
          const canMute = moderator && !p.local && !!p.audio;
          return (
            <TouchableOpacity
              key={p.session_id}
              activeOpacity={canMute ? 0.8 : 1}
              onPress={() => canMute && setSelected(selected === p.session_id ? null : p.session_id)}
              style={[s.tile, { width: `${100 / columns - 2}%` }, p.owner && s.tileOwner]}
            >
              {video || audioTrack(p) ? (
                <DailyMediaView
                  videoTrack={video}
                  audioTrack={p.local ? null : audioTrack(p)}
                  mirror={!!p.local}
                  objectFit="cover"
                  style={StyleSheet.absoluteFillObject}
                />
              ) : null}
              {!video && (
                <View style={s.avatar}>
                  <Text style={s.avatarTxt}>{String(p.user_name || '?').charAt(0)}</Text>
                </View>
              )}
              <View style={s.nameBar}>
                {!p.audio && <Ionicons name="mic-off" size={12} color="#f87171" />}
                <Text style={s.name} numberOfLines={1}>
                  {p.local ? TEXT.you : p.user_name || TEXT.guest}{p.owner ? ` · ${TEXT.teacher}` : ''}
                </Text>
              </View>
              {selected === p.session_id && (
                <TouchableOpacity style={s.muteOne} onPress={() => mute(p.session_id)}>
                  <Ionicons name="mic-off" size={14} color="#fff" />
                  <Text style={s.muteTxt}>{TEXT.mute}</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={s.controls}>
        <TouchableOpacity style={[s.ctrlBtn, !micOn && s.ctrlBtnOff]} onPress={toggleMic}>
          <Ionicons name={micOn ? 'mic' : 'mic-off'} size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[s.ctrlBtn, !camOn && s.ctrlBtnOff]} onPress={toggleCam}>
          <Ionicons name={camOn ? 'videocam' : 'videocam-off'} size={18} color="#fff" />
        </TouchableOpacity>
        {moderator && (
          <TouchableOpacity style={s.muteAll} onPress={muteAll}>
            <Ionicons name="volume-mute" size={16} color="#fff" />
            <Text style={s.muteTxt}>{TEXT.muteAll}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0b1220' },
  center: { justifyContent: 'center', alignItems: 'center', gap: 10, padding: 20 },
  info: { color: '#94a3b8', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, padding: 6, paddingBottom: 64 },
  tile: {
    aspectRatio: 3 / 4, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1e293b',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  tileOwner: { borderColor: '#0ea5e9' },
  avatar: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  avatarTxt: { color: '#e2e8f0', fontSize: 28, fontWeight: '800' },
  nameBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center',
    gap: 4, paddingHorizontal: 6, paddingVertical: 4, backgroundColor: 'rgba(0,0,0,0.55)',
  },
  name: { flex: 1, color: '#fff', fontSize: 11, fontWeight: '700' },
  muteOne: {
    position: 'absolute', top: 6, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#dc2626', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5,
  },
  controls: {
    position: 'absolute', bottom: 10, alignSelf: 'center', flexDirection: 'row', gap: 12, alignItems: 'center',
  },
  ctrlBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(15,23,42,0.85)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  ctrlBtnOff: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  muteAll: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 14,
    borderRadius: 20, backgroundColor: '#dc2626',
  },
  muteTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },
});
