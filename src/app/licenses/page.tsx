'use client';

import { AuthGuard } from '@/components/auth-guard';
import { Sidebar } from '@/components/sidebar';
import { MobileHeader } from '@/components/mobile-header';
import { useEffect, useState, useCallback } from 'react';
import { licenseRepository } from '@/lib/repository';
import type { License, LicenseDevice } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus, Copy, Trash2, Power, PowerOff, RefreshCw, Building2 } from 'lucide-react';

export default function LicensesPage() {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <MobileHeader />
          <main className="flex-1 overflow-y-auto p-6">
            <LicensesContent />
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

function LicensesContent() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [devices, setDevices] = useState<LicenseDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showExtend, setShowExtend] = useState(false);
  const [extendTarget, setExtendTarget] = useState<License | null>(null);
  const [formName, setFormName] = useState('');
  const [formMaxDevices, setFormMaxDevices] = useState('2');
  const [formTrialDays, setFormTrialDays] = useState('30');
  const [extendDays, setExtendDays] = useState('30');

  const loadData = useCallback(async () => {
    try {
      const [lic, dev] = await Promise.all([
        licenseRepository.getAllLicenses(),
        licenseRepository.getAllDevices(),
      ]);
      setLicenses(lic);
      setDevices(dev);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async () => {
    if (!formName.trim()) return;
    try {
      const newLicense = await licenseRepository.createLicense(formName.trim(), parseInt(formMaxDevices) || 2, parseInt(formTrialDays) || 30);
      setLicenses(prev => [newLicense, ...prev]);
      setShowCreate(false);
      setFormName('');
      setFormMaxDevices('2');
      setFormTrialDays('30');
    } catch {}
  };

  const handleToggle = async (license: License) => {
    try {
      const updated = await licenseRepository.updateLicense(license.id, { active: !license.active });
      setLicenses(prev => prev.map(l => l.id === license.id ? updated : l));
    } catch {}
  };

  const handleDelete = async (license: License) => {
    if (!confirm(`¿Eliminar licencia de "${license.complex_name}"?`)) return;
    try {
      await licenseRepository.deleteLicense(license.id);
      setLicenses(prev => prev.filter(l => l.id !== license.id));
    } catch {}
  };

  const handleExtend = async () => {
    if (!extendTarget) return;
    const days = parseInt(extendDays) || 30;
    if (days <= 0) return;
    try {
      const updated = await licenseRepository.extendLicense(extendTarget.id, days);
      setLicenses(prev => prev.map(l => l.id === extendTarget.id ? updated : l));
      setShowExtend(false);
      setExtendTarget(null);
    } catch {}
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
  };

  const getDeviceCount = (licenseId: string) => devices.filter(d => d.license_id === licenseId).length;

  const getStatus = (license: License) => {
    const isExpired = license.trial_ends_at && new Date(license.trial_ends_at) < new Date();
    if (!license.active) return { label: 'Inactiva', variant: 'destructive' as const };
    if (isExpired) return { label: 'Expirada', variant: 'secondary' as const };
    return { label: 'Activa', variant: 'default' as const };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Licencias</h1>
          <p className="text-muted-foreground">{licenses.length} licencias registradas</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Licencia
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6"><div className="h-32" /></CardContent>
            </Card>
          ))}
        </div>
      ) : licenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">Sin licencias registradas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {licenses.map(license => {
            const isExpired = license.trial_ends_at && new Date(license.trial_ends_at) < new Date();
            const status = getStatus(license);
            const deviceCount = getDeviceCount(license.id);

            return (
              <Card key={license.id}>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">{license.complex_name}</h3>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-muted px-3 py-1.5 text-sm font-mono">{license.license_key}</code>
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(license.license_key)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{deviceCount}/{license.max_devices} dispositivos</span>
                    {license.trial_ends_at && (
                      <span className={isExpired ? 'text-destructive font-medium' : ''}>
                        {isExpired ? 'Expirado' : 'Expira'}: {new Date(license.trial_ends_at).toLocaleDateString('es-ES')}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {isExpired ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-green-500/30 text-green-500 hover:bg-green-500/10"
                        onClick={() => { setExtendTarget(license); setExtendDays('30'); setShowExtend(true); }}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reactivar
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleToggle(license)}
                      >
                        {license.active ? <PowerOff className="mr-2 h-4 w-4" /> : <Power className="mr-2 h-4 w-4" />}
                        {license.active ? 'Desactivar' : 'Activar'}
                      </Button>
                    )}
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(license)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Licencia</DialogTitle>
            <DialogDescription>Crea una nueva licencia para un conjunto residencial</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre del conjunto</Label>
              <Input placeholder="Ej: Villas del Encanto" value={formName} onChange={e => setFormName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Máx. dispositivos</Label>
                <Input type="number" value={formMaxDevices} onChange={e => setFormMaxDevices(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Días de prueba</Label>
                <Input type="number" value={formTrialDays} onChange={e => setFormTrialDays(e.target.value)} />
              </div>
            </div>
            <Button className="w-full" onClick={handleCreate}>Crear Licencia</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showExtend} onOpenChange={setShowExtend}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reactivar Licencia</DialogTitle>
            <DialogDescription>Extender el período de prueba de &quot;{extendTarget?.complex_name}&quot;</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Días de extensión</Label>
              <Input type="number" value={extendDays} onChange={e => setExtendDays(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleExtend}>Reactivar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
