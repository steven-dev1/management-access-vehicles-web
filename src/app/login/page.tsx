'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);

      // Set cookies for middleware
      document.cookie = `is_admin=true; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
      document.cookie = `license_active=true; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;

      // Also keep localStorage for backward compatibility
      localStorage.setItem('is_admin', 'true');
      localStorage.setItem('license_active', 'true');
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src="/favicon.png" alt="Logo" className="w-16 h-16 mx-auto rounded-2xl mb-4" />
          <CardTitle className="text-2xl">Panel Administrativo</CardTitle>
          <CardDescription>Ingresa tus credenciales para acceder</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>
          <div className="mt-4 pt-4 border-t border-[#374151]">
            <button onClick={() => router.push('/activate')} className="w-full flex items-center justify-center gap-2 text-sm text-[#9CA3AF] hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Volver a activar licencia
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
