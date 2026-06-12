import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { publicInvoiceApi } from '@/api/checkout';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, Check, Upload, ShieldCheck } from 'lucide-react';

export default function InvoicePage() {
  const { uuid } = useParams<{ uuid: string }>();
  const [copied,          setCopied]          = useState(false);
  const [selectedFile,    setSelectedFile]    = useState<File | null>(null);
  const [policyAccepted,  setPolicyAccepted]  = useState(false);
  const [uploadDone,      setUploadDone]      = useState(false);
  const [uploadError,     setUploadError]     = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: invoice, isLoading, isError } = useQuery({
    queryKey: ['public-invoice', uuid],
    queryFn:  () => publicInvoiceApi.getInvoice(uuid!),
    enabled:  !!uuid,
    retry:    1,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => publicInvoiceApi.uploadReceipt(uuid!, file),
    onSuccess: () => {
      setUploadDone(true);
      setUploadError('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setUploadError(msg || 'حدث خطأ أثناء رفع الوصل. يرجى المحاولة مرة أخرى.');
    },
  });

  const handleCopyAlias = () => {
    if (!invoice?.payment_account?.alias) return;
    navigator.clipboard.writeText(invoice.payment_account.alias);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────────
  if (isError || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="text-center space-y-2">
          <p className="text-xl font-bold text-gray-700">الفاتورة غير موجودة</p>
          <p className="text-muted-foreground text-sm">تأكد من صحة الرابط أو تواصل مع المنصة.</p>
        </div>
      </div>
    );
  }

  // ── Already paid ─────────────────────────────────────────────────────────────
  if (invoice.status !== 'pending_screenshot') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="max-w-sm w-full mx-4 bg-white rounded-2xl shadow-sm border p-8 text-center space-y-3">
          <div className="text-5xl">✅</div>
          <h2 className="text-xl font-bold">تم استلام الوصل</h2>
          <p className="text-sm text-muted-foreground">
            {invoice.status === 'pending_approval'
              ? 'وصلك قيد المراجعة من قبل الإدارة. سيتم إشعارك عند التفعيل.'
              : 'تم تفعيل اشتراكك بنجاح.'}
          </p>
        </div>
      </div>
    );
  }

  // ── Upload success ────────────────────────────────────────────────────────────
  if (uploadDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="max-w-sm w-full mx-4 bg-white rounded-2xl shadow-sm border p-8 text-center space-y-3">
          <div className="text-5xl">🎉</div>
          <h2 className="text-xl font-bold">شكراً! تم استلام الوصل</h2>
          <p className="text-sm text-muted-foreground">
            سيتم مراجعة الوصل من قبل الإدارة وتفعيل اشتراكك خلال وقت قصير.
          </p>
        </div>
      </div>
    );
  }

  // ── Main invoice page ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center py-10 px-4" dir="rtl">
      <div className="max-w-md w-full space-y-5">

        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-2xl font-extrabold">
            <span className="text-amber-500">i</span>
            <span className="text-gray-800">Fluent</span>
          </p>
          <p className="text-sm text-muted-foreground">فاتورة الدفع الامن</p>
        </div>

        {/* Invoice card */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-5">

          {/* Student + amount */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">الطالب</p>
              <p className="font-semibold">{invoice.student_name}</p>
            </div>
            <div className="text-left">
              <p className="text-xs text-muted-foreground">المبلغ المطلوب</p>
              <p className="text-2xl font-bold text-emerald-700">{invoice.amount_due} د.أ</p>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            المدة: {invoice.months_count} {invoice.months_count === 1 ? 'شهر' : 'شهور'} ({invoice.months_count * 12} درس)
          </div>

          <hr />

          {/* CliQ instructions */}
          <div className="space-y-3">
            <p className="font-semibold text-gray-800">
              يرجى التحويل عبر نظام كليك CliQ إلى الاسم المستعار الموضح أدناه:
            </p>

            {/* Alias with copy button */}
            <div className="flex items-center gap-3 bg-gray-50 border rounded-xl px-4 py-3">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-0.5">{invoice.payment_account.cliq_name}</p>
                <p className="font-mono font-bold text-lg tracking-wide">
                  {invoice.payment_account.alias}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={handleCopyAlias}
              >
                {copied
                  ? <><Check className="h-3.5 w-3.5 text-emerald-600" /> تم النسخ</>
                  : <><Copy className="h-3.5 w-3.5" /> نسخ</>}
              </Button>
            </div>

            {/* Security notice */}
            <div className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
              <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 leading-relaxed space-y-1">
                <p className="font-semibold">ملاحظة أمان:</p>
                <p>
                  عند إدخال المعرّف في تطبيق البنك، سيظهر لكم اسم حساب المحصل المالي الشخصي المعتمد
                  للمنصة باسم{' '}
                  <span className="font-semibold">Yazan Sameer Abd AlLatif AbuAlShaikh</span>
                  {' '}أو{' '}
                  <span className="font-semibold">Moayad Sameer</span>.
                  هذا أمر طبيعي وتأكيد على صحة الحساب.
                </p>
              </div>
            </div>
          </div>

          <hr />

          {/* Receipt upload */}
          <div className="space-y-3">
            <p className="font-semibold text-gray-800">بعد التحويل، ارفع صورة الوصل:</p>

            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedFile ? (
                <p className="text-sm font-medium text-emerald-700">{selectedFile.name}</p>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">اضغط لاختيار صورة الوصل</p>
                  <p className="text-xs text-gray-400 mt-1">JPG، PNG، أو PDF — حد أقصى 5 ميغابايت</p>
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

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={policyAccepted}
                onChange={(e) => setPolicyAccepted(e.target.checked)}
                className="h-4 w-4 mt-0.5 cursor-pointer accent-emerald-600 rounded shrink-0"
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                أوافق على{' '}
                <a
                  href="/ifluent_Platform_Policies.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 font-semibold underline underline-offset-2 hover:text-emerald-800"
                >
                  سياسة الاشتراك
                </a>
              </span>
            </label>

            {uploadError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {uploadError}
              </p>
            )}

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={!selectedFile || !policyAccepted || uploadMutation.isPending}
              onClick={() => selectedFile && uploadMutation.mutate(selectedFile)}
            >
              {uploadMutation.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin ml-1" /> جاري الرفع...</>
                : 'إرسال الوصل'}
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">
          للمساعدة تواصل مع فريق iFluent
        </p>
      </div>
    </div>
  );
}
