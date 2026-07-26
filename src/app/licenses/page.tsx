'use client';

import { useEffect, useState, useCallback } from 'react';
import { getLicenses, getLicenseDevices, createLicense, extendLicense, toggleLicenseDevice, deleteLicense } from '@/lib/repository';
import type { License, LicenseDevice } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Copy, Trash2, Power, PowerOff, RefreshCw, Building2, Smartphone, Calendar, Key } from 'lucide-react';

export default function LicensesPage() {
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
      const lic = await getLicenses();
      setLicenses(lic);
      const allDevices: LicenseDevice[] = [];
      for (const l of lic) {
        const devs = await getLicenseDevices(l.id);
        allDevices.push(...devs);
      }
      setDevices(allDevices);
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async () => {
    if (!formName.trim()) return;
    try {
      const newLicense = await createLicense(formName.trim(), parseInt(formMaxDevices) || 2, parseInt(formTrialDays) || 30);
      setLicenses(prev => [newLicense, ...prev]);
      setShowCreate(false);
      setFormName('');
      setFormMaxDevices('2');
      setFormTrialDays('30');
    } catch { }
  };

  const handleDelete = async (license: License) => {
    if (!confirm(`¿Eliminar licencia de "${license.complex_name}"?`)) return;
    try {
      await deleteLicense(license.id);
      setLicenses(prev => prev.filter(l => l.id !== license.id));
    } catch { }
  };

  const handleExtend = async () => {
    if (!extendTarget) return;
    const days = parseInt(extendDays) || 30;
    if (days <= 0) return;
    try {
      const updated = await extendLicense(extendTarget.id, days);
      setLicenses(prev => prev.map(l => l.id === extendTarget.id ? updated : l));
      setShowExtend(false);
      setExtendTarget(null);
    } catch { }
  };

  const handleToggleDevice = async (device: LicenseDevice) => {
    try {
      await toggleLicenseDevice(device.id, !device.active);
      setDevices(prev => prev.map(d => d.id === device.id ? { ...d, active: !d.active } : d));
    } catch { }
  };

  const handleCopy = (key: string) => { navigator.clipboard.writeText(key); };

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
          <h1 className="text-2xl font-bold text-white">Licencias</h1>
          <p className="text-slate-400">{licenses.length} licencias registradas</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Nueva Licencia
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse bg-blue-950/40 border-blue-900/40">
              <CardContent className="p-6"><div className="h-32" /></CardContent>
            </Card>
          ))}
        </div>
      ) : licenses.length === 0 ? (
        <Card className="bg-blue-950/40 border-blue-900/40">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="mb-4 h-12 w-12 text-slate-600" />
            <p className="text-slate-400">Sin licencias registradas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {licenses.map(license => {
            const isExpired = license.trial_ends_at && new Date(license.trial_ends_at) < new Date();
            const status = getStatus(license);
            const deviceCount = getDeviceCount(license.id);

            return (
              <Card key={license.id} className="bg-blue-950/40 border-blue-900/40">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-400" />
                      <h3 className="font-semibold text-white">{license.complex_name}</h3>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-blue-900/30 px-3 py-1.5 text-sm font-mono text-white">{license.license_key}</code>
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(license.license_key)} className="text-slate-400 hover:text-white">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>{deviceCount}/{license.max_devices} dispositivos</span>
                    {license.trial_ends_at && (
                      <span className={isExpired ? 'text-red-400 font-medium' : ''}>
                        {isExpired ? 'Expirado' : 'Expira'}: {new Date(license.trial_ends_at).toLocaleDateString('es-CO')}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {isExpired ? (
                      <Button variant="outline" size="sm" className="flex-1 border-green-500/30 text-green-500 hover:bg-green-500/10"
                        onClick={() => { setExtendTarget(license); setExtendDays('30'); setShowExtend(true); }}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Reactivar
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="flex-1 border-slate-600 text-white hover:bg-slate-700" onClick={() => handleDelete(license)}>
                        <Trash2 className="h-4 w-4" /> Eliminar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Devices section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-white mb-4">Dispositivos ({devices.length})</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {devices.map(device => {
            const isRecent = new Date(device.registered_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return (
              <Card key={device.id} className="bg-blue-950/40 border-blue-900/40">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isRecent ? 'bg-green-500/10' : 'bg-blue-900/30'}`}>
                        <Smartphone className={`h-5 w-5 ${isRecent ? 'text-green-400' : 'text-slate-400'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-white">{device.device_name || 'Desconocido'}</p>
                        <p className="text-sm text-blue-400">{licenses.find(l => l.id === device.license_id)?.complex_name}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleToggleDevice(device)} className="text-slate-400 hover:text-white">
                      {device.active ? <PowerOff className="h-4 w-4 text-red-400" /> : <Power className="h-4 w-4 text-green-400" />}
                    </Button>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <Key className="h-3.5 w-3.5" />
                      <code className="font-mono text-xs">{licenses.find(l => l.id === device.license_id)?.license_key}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(device.registered_at).toLocaleDateString('es-CO')}</span>
                    </div>
                  </div>
                  <p className="mt-3 truncate text-xs text-slate-600">ID: {device.device_id}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Create dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="bg-blue-950/60 border-blue-900/50 w-full max-w-md mx-4">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">Nueva Licencia</h2>
              <div className="space-y-2">
                <Label className="text-slate-300">Nombre del conjunto</Label>
                <Input placeholder="Ej: Villas del Encanto" value={formName} onChange={e => setFormName(e.target.value)} className="bg-blue-900/30 border-slate-600 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Máx. dispositivos</Label>
                  <Input type="number" value={formMaxDevices} onChange={e => setFormMaxDevices(e.target.value)} className="bg-blue-900/30 border-slate-600 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Días de prueba</Label>
                  <Input type="number" value={formTrialDays} onChange={e => setFormTrialDays(e.target.value)} className="bg-blue-900/30 border-slate-600 text-white" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1 border-slate-600 text-white">Cancelar</Button>
                <Button onClick={handleCreate} className="flex-1 bg-blue-600 hover:bg-blue-700">Crear</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Extend dialog */}
      {showExtend && extendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="bg-blue-950/60 border-blue-900/50 w-full max-w-md mx-4">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">Reactivar Licencia</h2>
              <p className="text-slate-400 text-sm">Extender período de prueba de &quot;{extendTarget.complex_name}&quot;</p>
              <div className="space-y-2">
                <Label className="text-slate-300">Días de extensión</Label>
                <Input type="number" value={extendDays} onChange={e => setExtendDays(e.target.value)} className="bg-blue-900/30 border-slate-600 text-white" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowExtend(false)} className="flex-1 border-slate-600 text-white">Cancelar</Button>
                <Button onClick={handleExtend} className="flex-1 bg-green-600 hover:bg-green-700">Reactivar</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
