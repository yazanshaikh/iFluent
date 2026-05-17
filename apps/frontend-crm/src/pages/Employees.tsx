import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router-dom';
import { staffApi, type StaffRole, type CreateStaffPayload, type CreateTeacherPayload } from '@/api/staff';
import { useAuthStore } from '@/stores/authStore';
import { Badge }    from '@/components/ui/badge';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, UserPlus, Briefcase } from 'lucide-react';

/* ── Role labels ── */
const ROLE_LABELS: Record<StaffRole, string> = {
  cc:      'CC — مبيعات',
  ss:      'SS — متابعة',
  teacher: 'مدرّس',
};

const ROLE_VARIANT: Record<StaffRole, 'default' | 'secondary' | 'outline'> = {
  cc:      'default',
  ss:      'secondary',
  teacher: 'outline',
};

/* ── Add Staff Dialog ── */
interface AddStaffForm {
  name:            string;
  email:           string;
  password:        string;
  password2:       string;
  role:            StaffRole;
  bio:             string;
  specialization:  string;
  commission_rate: string;
}

const EMPTY: AddStaffForm = {
  name: '', email: '', password: '', password2: '', role: 'cc',
  bio: '', specialization: '', commission_rate: '',
};

function AddStaffDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form,  setForm]  = useState<AddStaffForm>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const isTeacher = form.role === 'teacher';

  const mutation = useMutation({
    mutationFn: (payload: CreateStaffPayload | CreateTeacherPayload) =>
      isTeacher
        ? staffApi.createTeacher(payload as CreateTeacherPayload)
        : staffApi.createCrm(payload as CreateStaffPayload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['staff'] });
      setForm(EMPTY);
      setError(null);
      onClose();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(msg ?? 'حدث خطأ أثناء إنشاء الحساب');
    },
  });

  const set = (field: keyof AddStaffForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim())  { setError('الاسم مطلوب'); return; }
    if (!form.email.trim()) { setError('البريد الإلكتروني مطلوب'); return; }
    if (form.password.length < 8) { setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return; }
    if (form.password !== form.password2) { setError('كلمتا المرور غير متطابقتين'); return; }

    if (isTeacher) {
      mutation.mutate({
        name:            form.name.trim(),
        email:           form.email.trim(),
        password:        form.password,
        bio:             form.bio.trim() || undefined,
        specialization:  form.specialization.trim() || undefined,
        commission_rate: form.commission_rate ? Number(form.commission_rate) : undefined,
      } satisfies CreateTeacherPayload);
    } else {
      mutation.mutate({
        name:     form.name.trim(),
        email:    form.email.trim(),
        password: form.password,
        role:     form.role as 'cc' | 'ss',
      } satisfies CreateStaffPayload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setForm(EMPTY); setError(null); onClose(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>إضافة موظف جديد</DialogTitle>
          <DialogDescription>
            أنشئ حساباً جديداً وحدد الدور الوظيفي
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="st-name">الاسم الكامل <span className="text-destructive">*</span></Label>
            <Input
              id="st-name" value={form.name} onChange={set('name')}
              placeholder="أحمد محمد" required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="st-email">البريد الإلكتروني <span className="text-destructive">*</span></Label>
            <Input
              id="st-email" type="email" value={form.email} onChange={set('email')}
              placeholder="ahmed@ifluent.com" dir="ltr" required
            />
          </div>

          <div className="space-y-1.5">
            <Label>الدور الوظيفي <span className="text-destructive">*</span></Label>
            <Select
              value={form.role}
              onValueChange={(v) => setForm((f) => ({ ...f, role: v as StaffRole }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cc">CC — Client Coordinator (مبيعات)</SelectItem>
                <SelectItem value="ss">SS — Sales Support (متابعة)</SelectItem>
                <SelectItem value="teacher">مدرّس (Teacher)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* حقول خاصة بالمدرّس */}
          {isTeacher && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="st-spec">التخصص (اختياري)</Label>
                <Input
                  id="st-spec" value={form.specialization} onChange={set('specialization')}
                  placeholder="Business English, IELTS…"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="st-bio">نبذة (اختياري)</Label>
                  <Input id="st-bio" value={form.bio} onChange={set('bio')} placeholder="مدرّس لغة إنجليزية…" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="st-comm">نسبة العمولة %</Label>
                  <Input
                    id="st-comm" type="number" min={0} max={100} dir="ltr"
                    value={form.commission_rate} onChange={set('commission_rate')}
                    placeholder="0"
                  />
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="st-pw">كلمة المرور <span className="text-destructive">*</span></Label>
              <Input
                id="st-pw" type="password" value={form.password} onChange={set('password')}
                placeholder="••••••••" dir="ltr" minLength={8} required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="st-pw2">تأكيد كلمة المرور</Label>
              <Input
                id="st-pw2" type="password" value={form.password2} onChange={set('password2')}
                placeholder="••••••••" dir="ltr" required
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              إلغاء
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <UserPlus className="h-4 w-4 ml-1" />}
              {isTeacher ? 'إنشاء حساب المدرّس' : 'إنشاء الموظف'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Page ── */
export default function EmployeesPage() {
  const user              = useAuthStore((s) => s.user);
  const navigate          = useNavigate();
  const [addOpen, setAddOpen] = useState(false);

  // ✅ جميع الـ hooks يجب أن تُستدعى قبل أي return مشروط (React Rules of Hooks)
  const { data: rawStaff, isLoading, isError } = useQuery({
    queryKey: ['staff'],
    queryFn:  staffApi.list,
    staleTime: 60_000,
    enabled:  user?.role === 'super_admin',
  });

  // طبقة أمان ثانية: تأكد أن البيانات array حتى لو جاء الـ response بشكل غير متوقع
  const staff = Array.isArray(rawStaff) ? rawStaff : [];

  /* حماية: فقط super_admin — يأتي بعد جميع الـ hooks */
  if (user?.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <AddStaffDialog open={addOpen} onClose={() => setAddOpen(false)} />

      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Briefcase className="h-6 w-6" />
              Employee Management
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {staff.length > 0 ? `${staff.length} موظف` : 'إدارة موظفي CRM'}
            </p>
          </div>
          <Button className="gap-2" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            إضافة موظف
          </Button>
        </div>

        {/* Role legend */}
        <div className="flex gap-3 text-sm text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1.5">
            <Badge variant="default">CC</Badge>
            <span>Client Coordinator — مسؤول المبيعات والإقناع</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary">SS</Badge>
            <span>Sales Support — مسؤول المتابعة وتحديث الحالات</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline">مدرّس</Badge>
            <span>Teacher — يدير الجلسات التعليمية</span>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-base font-semibold">قائمة الموظفين</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin ml-2" />
                جارٍ التحميل...
              </div>
            ) : isError ? (
              <p className="text-center py-16 text-destructive">حدث خطأ أثناء جلب البيانات</p>
            ) : staff.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground space-y-2">
                <p className="text-3xl">👥</p>
                <p>لا يوجد موظفون بعد</p>
                <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                  أضف أول موظف
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-right pb-3 pr-4 font-medium">الاسم</th>
                      <th className="text-right pb-3 font-medium">البريد الإلكتروني</th>
                      <th className="text-right pb-3 font-medium">الدور</th>
                      <th className="text-right pb-3 font-medium">Leads</th>
                      <th className="text-right pb-3 font-medium">تاريخ الإضافة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map((member) => (
                      <tr
                        key={member.id}
                        className="border-b last:border-0 hover:bg-muted/40 transition-colors cursor-pointer"
                        onClick={() => navigate(`/employees/${member.id}`)}
                      >
                        <td className="py-3 pr-4 font-medium text-primary hover:underline">
                          {member.name}
                        </td>
                        <td className="py-3 text-muted-foreground" dir="ltr">
                          {member.email}
                        </td>
                        <td className="py-3">
                          <Badge variant={ROLE_VARIANT[member.role]}>
                            {ROLE_LABELS[member.role]}
                          </Badge>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {member.leads_count ?? '—'}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {new Date(member.created_at).toLocaleDateString('ar-SA')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
