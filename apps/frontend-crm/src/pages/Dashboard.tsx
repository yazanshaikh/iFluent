import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, GraduationCap, TrendingUp } from 'lucide-react';

const STATS = [
  { label: 'عملاء محتملون',   value: '—', icon: Users,          color: 'text-blue-500' },
  { label: 'حجوزات اليوم',    value: '—', icon: BookOpen,        color: 'text-emerald-500' },
  { label: 'طلاب نشطون',     value: '—', icon: GraduationCap,   color: 'text-purple-500' },
  { label: 'معدل التحويل',    value: '—', icon: TrendingUp,      color: 'text-amber-500' },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          أهلاً، {user?.name} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          هذا ملخص نشاط اليوم في منصة iFluent
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">سيتم ربطها بالـ API</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">آخر العملاء المحتملين</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            اذهب إلى صفحة «العملاء المحتملون» لإدارة الـ Leads
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
