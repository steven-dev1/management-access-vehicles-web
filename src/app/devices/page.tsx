'use client';

import { AuthGuard } from '@/components/auth-guard';
import { Sidebar } from '@/components/sidebar';
import { MobileHeader } from '@/components/mobile-header';
import { useEffect, useState, useCallback } from 'react';
import { licenseRepository } from '@/lib/repository';
import type { LicenseWithDeviceData } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Smartphone, X, Calendar, Key } from 'lucide-react';

export default function DevicesPage() {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <MobileHeader />
          <main className="flex-1 overflow-y-auto p-6">
            <DevicesContent />
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

function DevicesContent() {
  const [devices, setDevices] = useState<LicenseWithDeviceData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const dev = await licenseRepository.getAllDevices();
      setDevices(dev);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRemove = async (device: LicenseWithDeviceData) => {
    if (!confirm(`¿Desactivar "${device.device_name}" de ${device.complex_name}?`)) return;
    try {
      await licenseRepository.removeDevice(device.id);
      setDevices(prev => prev.filter(d => d.id !== device.id));
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dispositivos</h1>
          <p className="text-muted-foreground">{devices.length} dispositivos registrados</p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6"><div className="h-24" /></CardContent>
            </Card>
          ))}
        </div>
      ) : devices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Smartphone className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">Sin dispositivos registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {devices.map(device => {
            const isRecent = new Date(device.registered_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return (
              <Card key={device.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isRecent ? 'bg-green-500/10' : 'bg-muted'}`}>
                        <Smartphone className={`h-5 w-5 ${isRecent ? 'text-green-500' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <p className="font-medium">{device.device_name || 'Desconocido'}</p>
                        {device.complex_name && (
                          <p className="text-sm text-primary">{device.complex_name}</p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemove(device)}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Key className="h-3.5 w-3.5" />
                      <code className="font-mono text-xs">{device.license_key}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(device.registered_at).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>

                  <p className="mt-3 truncate text-xs text-muted-foreground/60">ID: {device.device_id}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
