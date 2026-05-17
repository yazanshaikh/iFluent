import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button }  from '@/components/ui/button';
import { Input }   from '@/components/ui/input';
import { Label }   from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { authApi }     from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 }     from 'lucide-react';

export default function LoginPage() {
  const navigate  = useNavigate();
  const setAuth   = useAuthStore((s) => s.setAuth);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await authApi.login({ email, password });
      setAuth(token, user);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setError(msg ?? 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1B2A4A] to-[#0f1a30] p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center pb-2">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-[#1B2A4A] flex items-center justify-center shadow-lg">
              <span className="text-2xl font-extrabold">
                <span className="text-[#FFC107]">i</span>
                <span className="text-white">F</span>
              </span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">مرحباً بك</CardTitle>
          <CardDescription>سجّل دخولك إلى لوحة تحكم iFluent CRM</CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@ifluent.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                dir="ltr"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                dir="ltr"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive text-center rounded-md bg-destructive/10 px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : null}
              {loading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
