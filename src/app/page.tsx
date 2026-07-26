'use client';

import { AuthGuard } from '@/components/auth-guard';
import { Sidebar } from '@/components/sidebar';
import { MobileHeader } from '@/components/mobile-header';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Key, Smartphone, Clock } from 'lucide-react';

interface Stats {
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  totalDevices: number;
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <DashboardContent />
      </DashboardLayout>
    </AuthGuard>
  );
}

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function DashboardContent() {
  const { session } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    loadStats();
  }, [session]);

  const loadStats = async () => {
    try {
      const [licenses, devices] = await Promise.all([
        supabase.from('licenses').select('*'),
        supabase.from('license_devices').select('*').eq('active', true),
      ]);

      const allLicenses = licenses.data || [];
      const now = new Date();

      setStats({
        totalLicenses: allLicenses.length,
        activeLicenses: allLicenses.filter(l => l.active).length,
        expiredLicenses: allLicenses.filter(l => l.active && l.trial_ends_at && new Date(l.trial_ends_at) < now).length,
        totalDevices: (devices.data || []).length,
      });
    } catch {
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Panel de Control</h1>
          <p className="text-muted-foreground">Gestión administrativa</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Panel de Control</h1>
        <p className="text-muted-foreground">Gestión administrativa</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => router.push('/licenses')}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Key className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalLicenses || 0}</p>
                <p className="text-sm text-muted-foreground">Licencias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
                <Car className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.activeLicenses || 0}</p>
                <p className="text-sm text-muted-foreground">Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.expiredLicenses || 0}</p>
                <p className="text-sm text-muted-foreground">Expiradas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => router.push('/devices')}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                <Smartphone className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.totalDevices || 0}</p>
                <p className="text-sm text-muted-foreground">Dispositivos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
