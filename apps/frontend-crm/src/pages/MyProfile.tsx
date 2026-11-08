import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { staffApi } from '@/api/staff';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CcSalesCard } from '@/components/staff/CcSalesCard';

/** CC: own profile and sales counter. */
export default function MyProfilePage() {
  const user = useAuthStore((s) => s.user);
  const isCc = user?.role === 'cc';

  const { data: sales, isLoading } = useQuery({
    queryKey: ['my-sales'],
    queryFn:  staffApi.mySales,
    enabled:  isCc,
    staleTime: 30_000,
  });

  if (user && !isCc) return <Navigate to="/" replace />;

  return (
    <div className="p-6 space-y-6 max-w-2xl" dir="rtl">
      <h1 className="text-2xl font-bold">My Profile</h1>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-primary">{user?.name?.charAt(0)?.toUpperCase() ?? '?'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold truncate">{user?.name}</p>
              <p className="text-sm text-muted-foreground text-right" dir="ltr">{user?.email}</p>
            </div>
            <Badge variant="secondary" className="text-sm px-3 py-1">CC</Badge>
          </div>
        </CardContent>
      </Card>

      <CcSalesCard sales={sales} isLoading={isLoading} />
    </div>
  );
}
