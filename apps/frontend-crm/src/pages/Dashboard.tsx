import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import client from '@/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, UserCheck, Loader2, BarChart3, Clock, Banknote } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminDashboard {
  role: 'super_admin';
  summary: {
    leads_this_month:       number;
    conversions_this_month: number;
    conversion_rate:        number;
    revenue_this_month:     number;
    pending_approvals:      number;
  };
  leaderboard: {
    id:                     number;
    name:                   string;
    leads_this_month:       number;
    conversions_this_month: number;
    total_leads:            number;
    conversion_rate:        number;
  }[];
  period: { start: string; end: string; label: string };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, iconClass, bgClass,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  bgClass: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center gap-3">
          <div className={`h-11 w-11 rounded-xl ${bgClass} flex items-center justify-center shrink-0`}>
            <Icon className={`h-5 w-5 ${iconClass}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="text-2xl font-bold leading-tight">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RateBadge({ rate }: { rate: number }) {
  const cls =
    rate >= 20 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
    rate >= 10 ? 'bg-amber-100  text-amber-700  dark:bg-amber-950/40  dark:text-amber-400'  :
                 'bg-muted      text-muted-foreground';
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {rate}%
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  if (user?.role !== 'super_admin') return <Navigate to="/new-leads" replace />;

  const { data, isLoading } = useQuery({
    queryKey:        ['admin-dashboard'],
    queryFn:         () => client.get<AdminDashboard>('/crm/dashboard').then((r) => r.data),
    staleTime:       60_000,
    refetchInterval: 120_000,
  });

  const s      = data?.summary;
  const period = data?.period;
  const board  = data?.leaderboard ?? [];

  return (
    <div className="p-6 space-y-6 max-w-5xl" dir="rtl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">أهلاً، {user?.name} 👋</h1>
        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {period
            ? `إحصائيات ${period.label} — ${period.start} إلى ${period.end}`
            : 'جارٍ التحميل...'}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* ── Stats ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="ليدات دخلت هذا الشهر"
              value={s?.leads_this_month ?? 0}
              icon={Users}
              iconClass="text-blue-600"
              bgClass="bg-blue-50 dark:bg-blue-950/30"
            />
            <StatCard
              label="تحوّلت لمشتري"
              value={s?.conversions_this_month ?? 0}
              sub={`من أصل ${s?.leads_this_month ?? 0} ليدة`}
              icon={UserCheck}
              iconClass="text-emerald-600"
              bgClass="bg-emerald-50 dark:bg-emerald-950/30"
            />
            <StatCard
              label="معدل التحويل"
              value={`${s?.conversion_rate ?? 0}%`}
              icon={TrendingUp}
              iconClass="text-amber-600"
              bgClass="bg-amber-50 dark:bg-amber-950/30"
            />
            <StatCard
              label="إيرادات هذا الشهر"
              value={`${(s?.revenue_this_month ?? 0).toLocaleString()} د.أ`}
              icon={Banknote}
              iconClass="text-purple-600"
              bgClass="bg-purple-50 dark:bg-purple-950/30"
            />
          </div>

          {/* ── Employee performance ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                أداء الموظفين — {period?.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {board.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">
                  لا يوجد موظفون مسجّلون
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-muted-foreground">
                        <th className="text-right px-4 py-2.5 font-medium w-8">#</th>
                        <th className="text-right px-4 py-2.5 font-medium">الموظف</th>
                        <th className="text-center px-4 py-2.5 font-medium">ليدات الشهر</th>
                        <th className="text-center px-4 py-2.5 font-medium">مشترين</th>
                        <th className="text-center px-4 py-2.5 font-medium">نسبة التحويل</th>
                        <th className="text-center px-4 py-2.5 font-medium text-xs text-muted-foreground/70">إجمالي الليدات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {board.map((row, i) => (
                        <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{i + 1}</td>
                          <td className="px-4 py-3 font-semibold">{row.name}</td>
                          <td className="px-4 py-3 text-center tabular-nums">{row.leads_this_month}</td>
                          <td className="px-4 py-3 text-center tabular-nums">
                            <span className={row.conversions_this_month > 0 ? 'text-emerald-600 font-bold' : 'text-muted-foreground'}>
                              {row.conversions_this_month}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <RateBadge rate={row.conversion_rate} />
                          </td>
                          <td className="px-4 py-3 text-center text-muted-foreground text-xs tabular-nums">
                            {row.total_leads}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
