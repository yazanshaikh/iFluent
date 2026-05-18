import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useQuery, useMutation, useQueryClient,
} from '@tanstack/react-query';
import { leadsApi, type LeadStatus, type UpdateLeadPayload, type Remark } from '@/api/leads';
import { STATUS_LABELS, STATUS_VARIANT } from './Leads';
import { Badge }    from '@/components/ui/badge';
import { Button }   from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label }    from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  ArrowRight, Loader2, Phone, Mail, Calendar, MessageSquarePlus, User, ChevronDown, Gem,
  Pencil, Check, X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

const ROLE_LABELS: Record<string, string> = { cc: 'CC', ss: 'LP', super_admin: 'مدير' };

function RemarksHistory({ remarks, open, onToggle }: { remarks: Remark[]; open: boolean; onToggle: () => void }) {

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium bg-muted/40 hover:bg-muted/70 transition-colors"
      >
        <span className="flex items-center gap-2 text-muted-foreground">
          <MessageSquarePlus className="h-4 w-4" />
          سجل الملاحظات
          {remarks.length > 0 && (
            <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full font-mono">
              {remarks.length}
            </span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="divide-y">
          {remarks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">لا توجد ملاحظات بعد</p>
          ) : (
            remarks.map((r) => (
              <div key={r.id} className="px-4 py-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{r.staff?.name ?? '—'}</span>
                    {r.staff?.role && (
                      <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded font-mono">
                        {ROLE_LABELS[r.staff.role] ?? r.staff.role.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">{r.created_at}</span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{r.content}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/** الحالات التي يختارها الموظف يدوياً — open_sea وsubscriber تتغير نظامياً */
const SELECTABLE_STATUSES: LeadStatus[] = ['new', 'in_progress', 'interested', 'not_interested', 'postponed'];

export default function LeadProfilePage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc       = useQueryClient();
  const leadId   = Number(id);

  const [remarkBody,   setRemarkBody]   = useState('');
  const [historyOpen,  setHistoryOpen]  = useState(false);
  const [nameEditing,  setNameEditing]  = useState(false);
  const [nameDraft,    setNameDraft]    = useState('');
  const [statusDraft,  setStatusDraft]  = useState<LeadStatus | null>(null);
  const [statusError,  setStatusError]  = useState<string | null>(null);
  const [remarkError,  setRemarkError]  = useState<string | null>(null);

  /* ── Fetch lead ── */
  const { data: lead, isLoading, isError } = useQuery({
    queryKey: ['lead', leadId],
    queryFn:  () => leadsApi.get(leadId),
    enabled:  !!leadId,
  });

  /* ── Update status ── */
  const statusMutation = useMutation({
    mutationFn: (status: LeadStatus) => leadsApi.update(leadId, { status } as UpdateLeadPayload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead', leadId] });
      qc.invalidateQueries({ queryKey: ['leads'] });
      setStatusDraft(null);
      setStatusError(null);
    },
    onError: () => setStatusError('فشل تحديث الحالة'),
  });

  /* ── Edit name ── */
  const nameMutation = useMutation({
    mutationFn: (name: string) => leadsApi.update(leadId, { name } as UpdateLeadPayload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead', leadId] });
      setNameEditing(false);
    },
  });

  const handleNameSave = () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === lead?.name) { setNameEditing(false); return; }
    nameMutation.mutate(trimmed);
  };

  /* ── Toggle Small Treasury ── */
  const treasuryMutation = useMutation({
    mutationFn: () => leadsApi.toggleSmallTreasure(leadId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead', leadId] });
      qc.invalidateQueries({ queryKey: ['small-treasury'] });
    },
  });

  /* ── Add remark ── */
  const remarkMutation = useMutation({
    mutationFn: (content: string) => leadsApi.addRemark(leadId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead', leadId] });
      setRemarkBody('');
      setRemarkError(null);
      setHistoryOpen(true);
    },
    onError: () => setRemarkError('فشل إضافة الملاحظة'),
  });

  const handleAddRemark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remarkBody.trim()) { setRemarkError('الملاحظة لا يمكن أن تكون فارغة'); return; }
    remarkMutation.mutate(remarkBody.trim());
  };

  const handleStatusSave = () => {
    if (!statusDraft || statusDraft === lead?.status) return;
    statusMutation.mutate(statusDraft);
  };

  /* ── Loading / Error ── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-24 text-muted-foreground">
        <Loader2 className="animate-spin h-6 w-6 ml-2" />
        جارٍ التحميل...
      </div>
    );
  }

  if (isError || !lead) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 gap-3">
        <p className="text-destructive font-medium">لم يتم العثور على العميل</p>
        <Button variant="outline" onClick={() => navigate('/leads')}>
          العودة للقائمة
        </Button>
      </div>
    );
  }

  const currentStatus = statusDraft ?? lead.status;
  const remarks = lead.remarks ?? [];

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/leads')} className="gap-1 -mr-2">
        <ArrowRight className="h-4 w-4" />
        العودة للقائمة
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            {nameEditing ? (
              <div className="flex items-center gap-1.5">
                <Input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameSave();
                    if (e.key === 'Escape') setNameEditing(false);
                  }}
                  className="h-8 text-base font-bold w-44"
                />
                <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600" onClick={handleNameSave} disabled={nameMutation.isPending}>
                  {nameMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => setNameEditing(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group">
                <h1 className="text-xl font-bold">{lead.name}</h1>
                <Button
                  size="icon" variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
                  onClick={() => { setNameDraft(lead.name); setNameEditing(true); }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              أُضيف {new Date(lead.created_at).toLocaleDateString('ar-SA')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Badge variant={STATUS_VARIANT[lead.status]} className="text-sm px-3 py-1">
            {STATUS_LABELS[lead.status]}
          </Badge>
          <Button
            size="sm"
            variant={lead.is_small_treasure ? 'default' : 'outline'}
            className={
              lead.is_small_treasure
                ? 'gap-1.5 bg-amber-500 hover:bg-amber-600 text-white border-0'
                : 'gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50'
            }
            disabled={treasuryMutation.isPending}
            onClick={() => treasuryMutation.mutate()}
            title={lead.is_small_treasure ? 'إزالة من Small Treasury' : 'إضافة لـ Small Treasury'}
          >
            {treasuryMutation.isPending
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Gem className="h-3.5 w-3.5" />}
            {lead.is_small_treasure ? 'محمية' : 'Small Treasury'}
          </Button>
        </div>
      </div>

      {/* Contact info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">معلومات التواصل</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
            <span dir="ltr" className="text-sm">{lead.phone}</span>
          </div>
          {lead.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span dir="ltr" className="text-sm">{lead.email}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">
              آخر تحديث: {new Date(lead.updated_at).toLocaleDateString('ar-SA')}
            </span>
          </div>
          {lead.notes && (
            <>
              <Separator />
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.notes}</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Update Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">تحديث الحالة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Select
              value={currentStatus}
              onValueChange={(v) => setStatusDraft(v as LeadStatus)}
            >
              <SelectTrigger className="max-w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SELECTABLE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              size="sm"
              disabled={
                statusMutation.isPending ||
                currentStatus === lead.status ||
                !statusDraft
              }
              onClick={handleStatusSave}
            >
              {statusMutation.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : 'حفظ'}
            </Button>
          </div>
          {statusError && (
            <p className="text-sm text-destructive mt-2">{statusError}</p>
          )}
        </CardContent>
      </Card>

      {/* Remarks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquarePlus className="h-4 w-4" />
            الملاحظات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add remark form */}
          <form onSubmit={handleAddRemark} className="space-y-2">
            <Label htmlFor="remark-body">إضافة ملاحظة</Label>
            <Textarea
              id="remark-body"
              value={remarkBody}
              onChange={(e) => setRemarkBody(e.target.value)}
              placeholder="اكتب ملاحظتك هنا..."
              rows={3}
            />
            {remarkError && (
              <p className="text-sm text-destructive">{remarkError}</p>
            )}
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={remarkMutation.isPending}>
                {remarkMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-1" />}
                إضافة الملاحظة
              </Button>
            </div>
          </form>

          {/* Collapsible history */}
          <RemarksHistory
            remarks={remarks}
            open={historyOpen}
            onToggle={() => setHistoryOpen((o) => !o)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
