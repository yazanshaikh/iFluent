import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-full py-24 gap-4">
      <p className="text-6xl font-extrabold text-muted-foreground">404</p>
      <h1 className="text-xl font-semibold">الصفحة غير موجودة</h1>
      <Button variant="outline" onClick={() => navigate(-1)}>العودة</Button>
    </div>
  );
}
