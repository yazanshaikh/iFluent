/**
 * Hidden maintenance switch for the super-admin.
 *
 * Tap the avatar 4× (within ~1.5s) → password prompt (2232@#) → maintenance
 * panel that toggles the mobile apps' maintenance screen on/off.
 *
 * The password is only a soft UI gate; the real protection is the backend route
 * which requires a super_admin session.
 */
import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wrench, Power } from 'lucide-react';
import { maintenanceApi } from '@/api/maintenance';

const SECRET = '2232@#';
const TAPS_REQUIRED = 4;

export function MaintenanceSecret({ initials, enabled }: { initials: string; enabled: boolean }) {
  const qc = useQueryClient();
  const taps = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [pwOpen, setPwOpen]       = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [pw, setPw]               = useState('');
  const [pwErr, setPwErr]         = useState('');
  const [message, setMessage]     = useState('');

  const handleTap = () => {
    if (!enabled) return; // super-admin only
    taps.current += 1;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { taps.current = 0; }, 1500);
    if (taps.current >= TAPS_REQUIRED) {
      taps.current = 0;
      setPw('');
      setPwErr('');
      setPwOpen(true);
    }
  };

  const submitPw = () => {
    if (pw === SECRET) {
      setPwOpen(false);
      setPanelOpen(true);
    } else {
      setPwErr('كلمة المرور غير صحيحة');
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-maintenance'],
    queryFn:  maintenanceApi.get,
    enabled:  panelOpen,
  });

  const mutation = useMutation({
    mutationFn: (on: boolean) => maintenanceApi.set(on, message || undefined),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin-maintenance'] }),
  });

  const isOn = data?.maintenance ?? false;

  return (
    <>
      <button type="button" onClick={handleTap} className="shrink-0 outline-none" aria-label="admin">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </button>

      {/* Password gate */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-right">منطقة محمية</DialogTitle>
            <DialogDescription className="text-right">أدخل كلمة المرور للمتابعة.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-right block">كلمة المرور</Label>
            <Input
              type="password"
              value={pw}
              onChange={(e) => { setPw(e.target.value); setPwErr(''); }}
              onKeyDown={(e) => e.key === 'Enter' && submitPw()}
              autoFocus
            />
            {pwErr && <p className="text-xs text-destructive text-right">{pwErr}</p>}
          </div>
          <DialogFooter>
            <Button onClick={submitPw}>دخول</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Maintenance panel */}
      <Dialog open={panelOpen} onOpenChange={setPanelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-end gap-2 text-right">
              وضع الصيانة <Wrench className="h-4 w-4" />
            </DialogTitle>
            <DialogDescription className="text-right">
              يعرض لتطبيقات الطلاب والمعلمين شاشة صيانة بدل الواجهة.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span
                className={`text-sm font-bold ${isOn ? 'text-red-600' : 'text-emerald-600'}`}
              >
                {isLoading ? '…' : isOn ? 'مُفعّل الآن' : 'مُطفأ'}
              </span>
              <span className="text-sm text-muted-foreground">الحالة الحالية</span>
            </div>

            <div className="space-y-2">
              <Label className="text-right block">رسالة الطلاب (اختياري)</Label>
              <Textarea
                dir="rtl"
                rows={2}
                placeholder={data?.message ?? 'نقوم بصيانة دورية، نعود قريباً…'}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="destructive"
              disabled={mutation.isPending || isOn}
              onClick={() => mutation.mutate(true)}
              className="gap-1.5"
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
              تشغيل الصيانة
            </Button>
            <Button
              disabled={mutation.isPending || !isOn}
              onClick={() => mutation.mutate(false)}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
              إيقاف الصيانة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
