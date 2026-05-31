import axios from 'axios';
import { useRef, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkoutApi, type PendingOrder } from '@/api/checkout';
import { useAuthStore } from '@/stores/authStore';
import { invoiceFullUrl } from '@/lib/appUrl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Loader2, Upload, ClipboardList, Copy, Check, ExternalLink, Settings2,
  CheckCircle2, XCircle, FileImage,
} from 'lucide-react';

// ─── Pricing Dialog (Admin only) ──────────────────────────────────────────────

function PricingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [draft, setDraft]     = useState('');
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  const { data: currentPrice, isLoading } = useQuery({
    queryKey: ['price-per-lesson'],
    queryFn:  checkoutApi.getPricePerLesson,
    enabled:  open,
    staleTime: 60_000,
  });

  // Populate draft when price loads
  const priceDraft = draft !== '' ? draft : String(currentPrice ?? '');

  const saveMutation = useMutation({
    mutationFn: (price: number) => checkoutApi.updatePricePerLesson(price),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['price-per-lesson'] });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); setDraft(''); }, 1200);
    },
    onError: () => setError('فشل حفظ السعر، حاول مرة أخرى.'),
  });

  const handleSave = () => {
    const val = Number(priceDraft);
    if (!priceDraft || isNaN(val) || val < 1) {
      setError('أدخل سعراً صحيحاً أكبر من الصفر.');
      return;
    }
    setError('');
    saveMutation.mutate(val);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setDraft(''); setError(''); } }}>
      <DialogContent dir="rtl" className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            تعديل سعر الدرس الواحد
          </DialogTitle>
          <DialogDescription>
            سعر الدرس يُستخدم لحساب تكلفة الباقة تلقائياً عند إنشاء فاتورة.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>سعر الدرس الواحد (دينار أردني)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  dir="ltr"
                  value={priceDraft}
                  onChange={(e) => { setDraft(e.target.value); setError(''); }}
                  placeholder={String(currentPrice ?? 50)}
                  className="text-center font-bold text-lg"
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
                <span className="text-sm text-muted-foreground shrink-0">د.أ / شهر</span>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {success && (
              <p className="text-sm text-emerald-600 flex items-center gap-1">
                <Check className="h-4 w-4" /> تم الحفظ بنجاح
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => { onClose(); setDraft(''); setError(''); }}>
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending || isLoading}
          >
            {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-1" />}
            حفظ السعر
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Receipt Viewer Dialog ────────────────────────────────────────────────────

function ReceiptViewerDialog({
  screenshotUrl,
  onClose,
}: {
  screenshotUrl: string | null;
  onClose: () => void;
}) {
  const token                     = useAuthStore((s) => s.token);
  const [blobUrl,  setBlobUrl]    = useState<string | null>(null);
  const [isPdf,    setIsPdf]      = useState(false);
  const [loading,  setLoading]    = useState(false);
  const [error,    setError]      = useState('');

  // Fetch file with Bearer token and create a local blob URL
  useEffect(() => {
    if (!screenshotUrl) return;
    let revoke = '';
    setLoading(true);
    setError('');
    setBlobUrl(null);

    axios
      .get(screenshotUrl, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const url = URL.createObjectURL(res.data as Blob);
        revoke = url;
        setIsPdf((res.data as Blob).type === 'application/pdf');
        setBlobUrl(url);
      })
      .catch(() => setError('تعذّر تحميل الوصل، حاول مرة أخرى.'))
      .finally(() => setLoading(false));

    return () => { if (revoke) URL.revokeObjectURL(revoke); };
  }, [screenshotUrl, token]);

  const handleClose = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    onClose();
  };

  return (
    <Dialog open={!!screenshotUrl} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-2xl w-full" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5 text-primary" />
            وصل الدفع
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-[300px] flex items-center justify-center rounded-lg overflow-hidden bg-muted">
          {loading && <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />}

          {error && (
            <p className="text-sm text-destructive text-center px-4">{error}</p>
          )}

          {blobUrl && !isPdf && (
            <img
              src={blobUrl}
              alt="وصل الدفع"
              className="max-w-full max-h-[65vh] object-contain rounded"
            />
          )}

          {blobUrl && isPdf && (
            <iframe
              src={blobUrl}
              title="وصل الدفع"
              className="w-full h-[65vh] border-0 rounded"
            />
          )}
        </div>

        <DialogFooter>
          {blobUrl && (
            <a href={blobUrl} download="receipt">
              <Button variant="outline" size="sm">تحميل</Button>
            </a>
          )}
          <Button onClick={handleClose}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({
  order,
  copiedId,
  onCopy,
  onUpload,
  onApprove,
  onReject,
  onViewReceipt,
  isAdmin,
  isApprovalSection,
}: {
  order: PendingOrder;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  onUpload?: (order: PendingOrder) => void;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  onViewReceipt?: (url: string) => void;
  isAdmin: boolean;
  isApprovalSection: boolean;
}) {
  return (
    <Card className={isApprovalSection ? 'border-blue-200' : 'border-orange-200'}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base font-semibold">
            {order.student?.name ?? '—'}
          </CardTitle>
          <Badge variant={isApprovalSection ? 'secondary' : 'warning'} className="font-mono text-xs">
            {isApprovalSection ? 'بانتظار الموافقة' : 'بانتظار الوصل'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span>المبلغ:</span>
            <span className="font-semibold text-foreground">{order.amount_paid} دينار</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span>المدة:</span>
            <span className="font-semibold text-foreground">
              {order.lessons_count ? `${order.lessons_count} درس` : `${order.months_count} شهر`}
            </span>
          </div>
          {order.payment_account && (
            <>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span>الاسم المستعار:</span>
                <span className="font-mono font-bold text-foreground">
                  {order.payment_account.alias}
                </span>
                <button
                  onClick={() => onCopy(order.payment_account!.alias, `alias-${order.id}`)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="نسخ الاسم المستعار"
                >
                  {copiedId === `alias-${order.id}`
                    ? <Check className="h-3.5 w-3.5 text-emerald-600" />
                    : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div className="text-xs text-muted-foreground">{order.payment_account.cliq_name}</div>
            </>
          )}
          <div className="col-span-2 text-xs text-muted-foreground">
            بواسطة: {order.submitted_by?.name ?? '—'} ·{' '}
            {new Date(order.created_at).toLocaleDateString('ar-SA')}
          </div>
        </div>

        {/* Invoice URL */}
        {order.invoice_url && (
          <div className="flex items-center gap-2 bg-muted rounded-md px-2 py-1.5">
            <code className="flex-1 text-xs break-all">
              {invoiceFullUrl(order.invoice_url)}
            </code>
            <button
              onClick={() => onCopy(invoiceFullUrl(order.invoice_url!), `url-${order.id}`)}
              className="text-muted-foreground hover:text-foreground"
              title="نسخ الرابط"
            >
              {copiedId === `url-${order.id}`
                ? <Check className="h-3.5 w-3.5 text-emerald-600" />
                : <Copy className="h-3.5 w-3.5" />}
            </button>
            <a
              href={order.invoice_url}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground"
              title="فتح الفاتورة"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {!isApprovalSection && onUpload && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              onClick={() => onUpload(order)}
            >
              <Upload className="h-3.5 w-3.5" />
              رفع وصل الدفع
            </Button>
          )}

          {isApprovalSection && isAdmin && (
            <>
              {order.payment_screenshot_url && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => onViewReceipt?.(order.payment_screenshot_url!)}
                >
                  <FileImage className="h-3.5 w-3.5" />
                  عرض الوصل
                </Button>
              )}
              <Button
                size="sm"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => onApprove?.(order.id)}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                موافقة
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => onReject?.(order.id)}
              >
                <XCircle className="h-3.5 w-3.5" />
                رفض
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProcessOrdersPage() {
  const qc      = useQueryClient();
  const user    = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'super_admin';

  const [page,          setPage]          = useState(1);
  const [approvalPage,  setApprovalPage]  = useState(1);
  const [uploadTarget,  setUploadTarget]  = useState<PendingOrder | null>(null);
  const [selectedFile,  setSelectedFile]  = useState<File | null>(null);
  const [uploadError,   setUploadError]   = useState('');
  const [copiedId,      setCopiedId]      = useState<string | null>(null);
  const [pricingOpen,    setPricingOpen]    = useState(false);
  const [rejectTarget,   setRejectTarget]   = useState<number | null>(null);
  const [rejectReason,   setRejectReason]   = useState('');
  const [receiptViewUrl, setReceiptViewUrl] = useState<string | null>(null);
  // lesson range for approve
  const [lessonRangeMap, setLessonRangeMap] = useState<Record<number, { from: string; to: string }>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // pending_screenshot orders (employee's own, or all for admin)
  const { data: pendingScreenshot, isLoading } = useQuery({
    queryKey: ['process-orders', page],
    queryFn:  () => checkoutApi.listPendingOrders(page),
    staleTime: 30_000,
  });

  // pending_approval orders (admin only — section 7)
  const { data: pendingApproval, isLoading: isLoadingApproval } = useQuery({
    queryKey: ['pending-approval', approvalPage],
    queryFn:  () => checkoutApi.listPendingApproval(approvalPage),
    enabled:  isAdmin,
    staleTime: 30_000,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      checkoutApi.uploadReceiptForOrder(id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['process-orders'] });
      setUploadTarget(null);
      setSelectedFile(null);
      setUploadError('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setUploadError(msg || 'فشل رفع الوصل.');
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, fromId, toId }: { id: number; fromId?: number; toId?: number }) =>
      checkoutApi.approveOrder(id, {
        from_lesson_id: fromId || null,
        to_lesson_id:   toId   || null,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pending-approval'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      checkoutApi.rejectOrder(id, reason || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-approval'] });
      setRejectTarget(null);
      setRejectReason('');
    },
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const screenshotOrders: PendingOrder[] = pendingScreenshot?.data ?? [];
  const approvalOrders: PendingOrder[]   = pendingApproval?.data ?? [];

  return (
    <div className="p-6 space-y-8 max-w-4xl" dir="rtl">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <ClipboardList className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Process Orders</h1>

        {pendingScreenshot?.meta && (
          <Badge variant="secondary" className="font-mono">
            {pendingScreenshot.meta.total} فاتورة
          </Badge>
        )}

        {/* Admin-only pricing button */}
        {isAdmin && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 mr-auto"
            onClick={() => setPricingOpen(true)}
          >
            <Settings2 className="h-4 w-4" />
            تعديل سعر الدرس
          </Button>
        )}
      </div>

      {/* ── Section 1: pending_screenshot (upload receipt) ── */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-orange-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
          فواتير بانتظار رفع الوصل
          {!isAdmin && (
            <span className="text-xs text-muted-foreground font-normal">(فواتيرك أنت فقط)</span>
          )}
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : screenshotOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              لا توجد فواتير معلقة
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {screenshotOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  copiedId={copiedId}
                  onCopy={handleCopy}
                  onUpload={(o) => { setUploadTarget(o); setSelectedFile(null); setUploadError(''); }}
                  isAdmin={isAdmin}
                  isApprovalSection={false}
                />
              ))}
            </div>

            {pendingScreenshot?.meta && pendingScreenshot.meta.last_page > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>السابق</Button>
                <span className="text-sm text-muted-foreground">{page} / {pendingScreenshot.meta.last_page}</span>
                <Button variant="outline" size="sm" disabled={page === pendingScreenshot.meta.last_page} onClick={() => setPage((p) => p + 1)}>التالي</Button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Section 2 (Admin only — Section 7): pending_approval ── */}
      {isAdmin && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-blue-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
            موافقة الإدارة — فواتير بانتظار التفعيل
            {pendingApproval?.meta && (
              <Badge variant="secondary" className="font-mono text-xs">
                {pendingApproval.meta.total}
              </Badge>
            )}
          </h2>

          {isLoadingApproval ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : approvalOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground text-sm">
                لا توجد طلبات تحتاج موافقة
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-3">
                {approvalOrders.map((order) => {
                  const range = lessonRangeMap[order.id] ?? { from: '', to: '' };
                  return (
                    <div key={order.id} className="space-y-2">
                      <OrderCard
                        order={order}
                        copiedId={copiedId}
                        onCopy={handleCopy}
                        onApprove={(id) => approveMutation.mutate({
                          id,
                          fromId: range.from ? Number(range.from) : undefined,
                          toId:   range.to   ? Number(range.to)   : undefined,
                        })}
                        onReject={(id) => { setRejectTarget(id); setRejectReason(''); }}
                        onViewReceipt={(url) => setReceiptViewUrl(url)}
                        isAdmin={isAdmin}
                        isApprovalSection
                      />
                      {/* ── Lesson Range ── */}
                      <div className="flex items-center gap-2 px-1 pb-1" dir="rtl">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">نطاق الدروس:</span>
                        <input
                          type="number"
                          min={1}
                          placeholder="من درس #"
                          value={range.from}
                          onChange={(e) => setLessonRangeMap((prev) => ({
                            ...prev,
                            [order.id]: { ...range, from: e.target.value },
                          }))}
                          className="w-28 rounded-md border border-input bg-background px-2 py-1 text-sm text-right"
                        />
                        <span className="text-xs text-muted-foreground">→</span>
                        <input
                          type="number"
                          min={1}
                          placeholder="إلى درس #"
                          value={range.to}
                          onChange={(e) => setLessonRangeMap((prev) => ({
                            ...prev,
                            [order.id]: { ...range, to: e.target.value },
                          }))}
                          className="w-28 rounded-md border border-input bg-background px-2 py-1 text-sm text-right"
                        />
                        {range.from && range.to && (
                          <span className="text-xs text-green-600 font-medium">
                            {Number(range.to) - Number(range.from) + 1} درس
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {pendingApproval?.meta && pendingApproval.meta.last_page > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button variant="outline" size="sm" disabled={approvalPage === 1} onClick={() => setApprovalPage((p) => p - 1)}>السابق</Button>
                  <span className="text-sm text-muted-foreground">{approvalPage} / {pendingApproval.meta.last_page}</span>
                  <Button variant="outline" size="sm" disabled={approvalPage === pendingApproval.meta.last_page} onClick={() => setApprovalPage((p) => p + 1)}>التالي</Button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ── Receipt Viewer ── */}
      <ReceiptViewerDialog
        screenshotUrl={receiptViewUrl}
        onClose={() => setReceiptViewUrl(null)}
      />

      {/* ── Pricing Dialog ── */}
      <PricingDialog open={pricingOpen} onClose={() => setPricingOpen(false)} />

      {/* ── Upload Receipt Dialog ── */}
      <Dialog open={!!uploadTarget} onOpenChange={(o) => { if (!o) setUploadTarget(null); }}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>رفع وصل الدفع — {uploadTarget?.student?.name}</DialogTitle>
            <DialogDescription>
              ارفع صورة وصل التحويل نيابةً عن العميل (JPG، PNG، أو PDF — حد أقصى 5 ميغابايت).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedFile ? (
                <p className="text-sm font-medium text-emerald-700">{selectedFile.name}</p>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">اضغط لاختيار الملف</p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            />

            {uploadError && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {uploadError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadTarget(null)}>إلغاء</Button>
            <Button
              disabled={!selectedFile || uploadMutation.isPending}
              onClick={() => {
                if (uploadTarget && selectedFile) {
                  uploadMutation.mutate({ id: uploadTarget.id, file: selectedFile });
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {uploadMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-1" />}
              رفع الوصل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject Reason Dialog ── */}
      <Dialog open={rejectTarget !== null} onOpenChange={(o) => { if (!o) setRejectTarget(null); }}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle>رفض الطلب</DialogTitle>
            <DialogDescription>يمكنك إضافة سبب الرفض (اختياري).</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>سبب الرفض</Label>
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="مثال: الوصل غير واضح..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>إلغاء</Button>
            <Button
              variant="destructive"
              disabled={rejectMutation.isPending}
              onClick={() => {
                if (rejectTarget !== null) {
                  rejectMutation.mutate({ id: rejectTarget, reason: rejectReason });
                }
              }}
            >
              {rejectMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-1" />}
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
