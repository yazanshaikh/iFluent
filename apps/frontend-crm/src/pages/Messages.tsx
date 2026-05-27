import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Users, UserCheck, UserX, Inbox, Clock } from 'lucide-react';
import { messagesApi, type MessageTarget } from '@/api/messages';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge }    from '@/components/ui/badge';
import { cn }       from '@/lib/utils';

// ─── Target option ────────────────────────────────────────────────────────────

const TARGETS: { value: MessageTarget; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'all',              label: 'جميع الطلاب',      desc: 'كل الطلاب المسجلين في النظام',      icon: Users     },
  { value: 'subscribers',      label: 'المشتركون',         desc: 'طلاب لديهم اشتراك فعّال',            icon: UserCheck },
  { value: 'non_subscribers',  label: 'غير المشتركين',     desc: 'طلاب بدون اشتراك فعّال',             icon: UserX     },
];

const TARGET_LABEL: Record<MessageTarget, string> = {
  all:             'الكل',
  subscribers:     'المشتركون',
  non_subscribers: 'غير المشتركين',
};

const TARGET_VARIANT: Record<MessageTarget, 'default' | 'secondary' | 'outline'> = {
  all:             'default',
  subscribers:     'secondary',
  non_subscribers: 'outline',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const qc = useQueryClient();
  const [title,  setTitle]  = useState('');
  const [body,   setBody]   = useState('');
  const [target, setTarget] = useState<MessageTarget>('all');
  const [sent,   setSent]   = useState<{ count: number; title: string } | null>(null);

  const { data: history = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['admin-messages'],
    queryFn:  messagesApi.list,
  });

  const { mutate: send, isPending } = useMutation({
    mutationFn: () => messagesApi.send({ title, body, target }),
    onSuccess: (res) => {
      setSent({ count: res.recipients_count, title });
      setTitle('');
      setBody('');
      qc.invalidateQueries({ queryKey: ['admin-messages'] });
    },
  });

  const canSend = title.trim().length > 0 && body.trim().length > 0 && !isPending;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8" dir="rtl">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-extrabold">رسائل الإدارة</h1>
        <p className="text-sm text-muted-foreground mt-1">
          أرسل رسالة للطلاب — تظهر لهم كإشعار قابل للقراءة فقط
        </p>
      </div>

      {/* ── Compose card ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl border bg-card p-6 space-y-5 shadow-sm">
        <p className="text-sm font-bold text-foreground">📝 رسالة جديدة</p>

        {/* Target selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">المستهدفون</label>
          <div className="grid grid-cols-3 gap-3">
            {TARGETS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTarget(t.value)}
                className={cn(
                  'flex flex-col items-start gap-1 rounded-xl border p-3 text-right transition-all',
                  target === t.value
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-primary/40',
                )}
              >
                <t.icon className={cn('h-4 w-4', target === t.value ? 'text-primary' : 'text-muted-foreground')} />
                <span className="text-sm font-bold leading-tight">{t.label}</span>
                <span className="text-[11px] text-muted-foreground leading-tight">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">عنوان الرسالة</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: تحديث مهم بخصوص جدولكم"
            className="text-right"
            maxLength={255}
          />
        </div>

        {/* Body */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">نص الرسالة</label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="اكتب نص الرسالة هنا..."
            className="text-right min-h-[120px] resize-none"
            maxLength={5000}
          />
          <p className="text-[11px] text-muted-foreground text-left">{body.length} / 5000</p>
        </div>

        {/* Send button */}
        <Button
          onClick={() => send()}
          disabled={!canSend}
          className="w-full gap-2"
        >
          {isPending ? (
            <span className="animate-spin text-base">⏳</span>
          ) : (
            <Send className="h-4 w-4" />
          )}
          {isPending ? 'جاري الإرسال...' : `إرسال إلى ${TARGETS.find(t => t.value === target)?.label}`}
        </Button>

        {/* Success banner */}
        {sent && (
          <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 flex items-center gap-2">
            <span>✅</span>
            <span>
              تم إرسال "<strong>{sent.title}</strong>" بنجاح إلى{' '}
              <strong>{sent.count}</strong> طالب
            </span>
          </div>
        )}
      </div>

      {/* ── History ────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-sm font-bold flex items-center gap-2">
          <Inbox className="h-4 w-4 text-muted-foreground" />
          سجل الرسائل المرسلة
        </p>

        {loadingHistory ? (
          <p className="text-sm text-muted-foreground py-6 text-center">جاري التحميل...</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">لا توجد رسائل مرسلة بعد</p>
        ) : (
          history.map((msg) => (
            <div
              key={msg.id}
              className="rounded-xl border bg-card px-4 py-3 flex items-start gap-3 shadow-sm"
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm truncate">{msg.title}</span>
                  <Badge variant={TARGET_VARIANT[msg.target]} className="text-[10px] shrink-0">
                    {TARGET_LABEL[msg.target]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{msg.body}</p>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {msg.recipients_count} مستلم
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(msg.created_at).toLocaleDateString('ar-JO', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                  <span>بواسطة: {msg.sent_by}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
