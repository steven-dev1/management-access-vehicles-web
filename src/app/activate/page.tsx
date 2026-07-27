'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car, Key, ArrowRight, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { activateLicense } from '@/lib/repository';

export default function ActivatePage() {
  const router = useRouter();
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const deviceId = localStorage.getItem('device_id') || `web-${Date.now()}`;
      localStorage.setItem('device_id', deviceId);

      const { license } = await activateLicense(licenseKey, deviceId, navigator.userAgent.slice(0, 50));
      localStorage.setItem('license_id', license.id);
      localStorage.setItem('complex_name', license.complex_name);
      localStorage.setItem('license_active', 'true');
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Error al activar la licencia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#111111] to-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/20 mb-4">
            <Car className="w-8 h-8 text-[#3B82F6]" />
          </div>
          <h1 className="text-3xl font-bold text-white">Control de Acceso Vehicular</h1>
          <p className="text-slate-400">Sistema de Control de Acceso Vehicular</p>
        </div>

        <Card className="bg-[#1A1A1A] border-[#374151] backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-white flex items-center justify-center gap-2">
              <Key className="w-5 h-5" />
              Activar Licencia
            </CardTitle>
            <CardDescription className="text-slate-400">
              Ingresa tu clave de licencia para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleActivate} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="licenseKey" className="text-slate-300">Clave de Licencia</Label>
                <Input
                  id="licenseKey"
                  type="text"
                  placeholder="Ejemplo: LIC-XXXXXXX-XXXX"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  className="bg-[#1A1A1A] border-[#374151] text-white placeholder:text-slate-500 focus:border-blue-500"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !licenseKey}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Activar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#374151]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-900 px-3 text-slate-500">o</span>
            </div>
          </div>

          <button
            onClick={() => router.push('/login')}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            Soy administrador — Iniciar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
