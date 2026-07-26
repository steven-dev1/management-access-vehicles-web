'use client';

import { useEffect, useState, useCallback } from 'react';
import { getLicenses, getLicenseDevices, createLicense, updateLicense, setPermanent, extendLicense, toggleLicenseDevice, deleteLicense } from '@/lib/repository';
import type { License, LicenseDevice } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Copy, Trash2, Power, PowerOff, RefreshCw, Building2, Smartphone, Calendar, Key, Edit3, Check, X, Infinity } from 'lucide-react';

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [devices, setDevices] = useState<LicenseDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showExtend, setShowExtend] = useState(false);
  const [extendTarget, setExtendTarget] = useState<License | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMaxDevices, setEditMaxDevices] = useState('');
  const [editTrialDate, setEditTrialDate] = useState('');
  const [editPermanent, setEditPermanent] = useState(false);
  const [formName, setFormName] = useState('');
  const [formMaxDevices, setFormMaxDevices] = useState('2');
  const [formTrialDays, setFormTrialDays] = useState('30');
  const [formPermanent, setFormPermanent] = useState(false);
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
      const newLicense = await createLicense(formName.trim(), parseInt(formMaxDevices) || 2, formPermanent ? undefined : parseInt(formTrialDays) || 30);
      setLicenses(prev => [newLicense, ...prev]);
      setShowCreate(false);
      setFormName('');
      setFormMaxDevices('2');
      setFormTrialDays('30');
      setFormPermanent(false);
    } catch { }
  };

  const handleDelete = async (license: License) => {
    if (!confirm(`\u00bfEliminar licencia de "${license.complex_name}"?`)) return;
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

  const startEdit = (license: License) => {
    setEditingId(license.id);
    setEditMaxDevices(String(license.max_devices));
    setEditPermanent(!license.trial_ends_at);
    if (license.trial_ends_at) {
      setEditTrialDate(new Date(license.trial_ends_at).toISOString().split('T')[0]);
    } else {
      setEditTrialDate('');
    }
  };

  const handleSaveEdit = async (license: License) => {
    try {
      const updates: any = { max_devices: parseInt(editMaxDevices) || license.max_devices };
      if (editPermanent) {
        updates.trial_ends_at = null;
      } else if (editTrialDate) {
        updates.trial_ends_at = new Date(editTrialDate).toISOString();
      }
      const updated = await updateLicense(license.id, updates);
      setLicenses(prev => prev.map(l => l.id === license.id ? updated : l));
      setEditingId(null);
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
          <p className="text-[#9CA3AF]">{licenses.length} licencias registradas</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Nueva Licencia
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse bg-[#1A1A1A] border-[#374151]">
              <CardContent className="p-6"><div className="h-32" /></CardContent>
            </Card>
          ))}
        </div>
      ) : licenses.length === 0 ? (
        <Card className="bg-[#1A1A1A] border-[#374151]">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="mb-4 h-12 w-12 text-[#374151]" />
            <p className="text-[#9CA3AF]">Sin licencias registradas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {licenses.map(license => {
            const isExpired = license.trial_ends_at && new Date(license.trial_ends_at) < new Date();
            const isPermanent = !license.trial_ends_at;
            const status = getStatus(license);
            const deviceCount = getDeviceCount(license.id);
            const isEditing = editingId === license.id;

            return (
              <Card key={license.id} className="bg-[#1A1A1A] border-[#374151]">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-[#3B82F6]" />
                      <h3 className="font-semibold text-white">{license.complex_name}</h3>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-[#0A0A0A] px-3 py-1.5 text-sm font-mono text-white">{license.license_key}</code>
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(license.license_key)} className="text-[#9CA3AF] hover:text-white">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3 p-3 bg-[#0A0A0A] rounded-lg border border-[#374151]">
                      <div className="space-y-2">
                        <Label className="text-[#9CA3AF] text-xs">Max. dispositivos</Label>
                        <Input
                          type="number"
                          value={editMaxDevices}
                          onChange={e => setEditMaxDevices(e.target.value)}
                          className="h-8 bg-[#1A1A1A] border-[#374151] text-white text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-[#9CA3AF] text-xs">Permanente</Label>
                          <button
                            onClick={() => setEditPermanent(!editPermanent)}
                            className={`w-9 h-5 rounded-full transition-colors ${editPermanent ? 'bg-[#3B82F6]' : 'bg-[#374151]'}`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${editPermanent ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </button>
                        </div>
                        {!editPermanent && (
                          <Input
                            type="date"
                            value={editTrialDate}
                            onChange={e => setEditTrialDate(e.target.value)}
                            className="h-8 bg-[#1A1A1A] border-[#374151] text-white text-sm"
                          />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} className="flex-1 text-[#9CA3AF]">
                          <X className="mr-1 h-3 w-3" /> Cancelar
                        </Button>
                        <Button size="sm" onClick={() => handleSaveEdit(license)} className="flex-1 bg-[#3B82F6] hover:bg-[#2563EB]">
                          <Check className="mr-1 h-3 w-3" /> Guardar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between text-sm text-[#9CA3AF]">
                        <span>{deviceCount}/{license.max_devices} dispositivos</span>
                        {isPermanent ? (
                          <span className="flex items-center gap-1 text-[#3B82F6]">
                            <Infinity className="w-3.5 h-3.5" /> Permanente
                          </span>
                        ) : license.trial_ends_at ? (
                          <span className={isExpired ? 'text-[#EF4444] font-medium' : ''}>
                            {isExpired ? 'Expirado' : 'Expira'}: {new Date(license.trial_ends_at).toLocaleDateString('es-CO')}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => startEdit(license)} className="flex-1 border-[#374151] text-white hover:bg-[#2A2A2A]">
                          <Edit3 className="mr-1 h-3 w-3" /> Editar
                        </Button>
                        {isExpired ? (
                          <Button variant="outline" size="sm" className="flex-1 border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/10"
                            onClick={() => { setExtendTarget(license); setExtendDays('30'); setShowExtend(true); }}>
                            <RefreshCw className="mr-1 h-3 w-3" /> Reactivar
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="flex-1 border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/10" onClick={() => handleDelete(license)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </>
                  )}
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
              <Card key={device.id} className="bg-[#1A1A1A] border-[#374151]">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isRecent ? 'bg-[#10B981]/10' : 'bg-[#2A2A2A]'}`}>
                        <Smartphone className={`h-5 w-5 ${isRecent ? 'text-[#10B981]' : 'text-[#9CA3AF]'}`} />
                      </div>
                      <div>
                        <p className="font-medium text-white">{device.device_name || 'Desconocido'}</p>
                        <p className="text-sm text-[#3B82F6]">{licenses.find(l => l.id === device.license_id)?.complex_name}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleToggleDevice(device)} className="text-[#9CA3AF] hover:text-white">
                      {device.active ? <PowerOff className="h-4 w-4 text-[#EF4444]" /> : <Power className="h-4 w-4 text-[#10B981]" />}
                    </Button>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-[#9CA3AF]">
                    <div className="flex items-center gap-2">
                      <Key className="h-3.5 w-3.5" />
                      <code className="font-mono text-xs">{licenses.find(l => l.id === device.license_id)?.license_key}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(device.registered_at).toLocaleDateString('es-CO')}</span>
                    </div>
                  </div>
                  <p className="mt-3 truncate text-xs text-[#374151]">ID: {device.device_id}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Create dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="bg-[#1A1A1A] border-[#374151] w-full max-w-md mx-4">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">Nueva Licencia</h2>
              <div className="space-y-2">
                <Label className="text-[#9CA3AF]">Nombre del conjunto</Label>
                <Input placeholder="Ej: Villas del Encanto" value={formName} onChange={e => setFormName(e.target.value)} className="bg-[#0A0A0A] border-[#374151] text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#9CA3AF]">Max. dispositivos</Label>
                  <Input type="number" value={formMaxDevices} onChange={e => setFormMaxDevices(e.target.value)} className="bg-[#0A0A0A] border-[#374151] text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#9CA3AF]">Dias de prueba</Label>
                  <Input type="number" value={formTrialDays} onChange={e => setFormTrialDays(e.target.value)} disabled={formPermanent} className="bg-[#0A0A0A] border-[#374151] text-white disabled:opacity-40" />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded-lg">
                <div className="flex items-center gap-2">
                  <Infinity className="w-4 h-4 text-[#3B82F6]" />
                  <Label className="text-white text-sm">Suscripcion permanente</Label>
                </div>
                <button
                  onClick={() => setFormPermanent(!formPermanent)}
                  className={`w-9 h-5 rounded-full transition-colors ${formPermanent ? 'bg-[#3B82F6]' : 'bg-[#374151]'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${formPermanent ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1 border-[#374151] text-white hover:bg-[#2A2A2A]">Cancelar</Button>
                <Button onClick={handleCreate} className="flex-1 bg-blue-600 hover:bg-blue-700">Crear</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Extend dialog */}
      {showExtend && extendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="bg-[#1A1A1A] border-[#374151] w-full max-w-md mx-4">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">Reactivar Licencia</h2>
              <p className="text-[#9CA3AF] text-sm">Extender periodo de prueba de &quot;{extendTarget.complex_name}&quot;</p>
              <div className="space-y-2">
                <Label className="text-[#9CA3AF]">Dias de extension</Label>
                <Input type="number" value={extendDays} onChange={e => setExtendDays(e.target.value)} className="bg-[#0A0A0A] border-[#374151] text-white" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowExtend(false)} className="flex-1 border-[#374151] text-white hover:bg-[#2A2A2A]">Cancelar</Button>
                <Button onClick={handleExtend} className="flex-1 bg-[#10B981] hover:bg-[#059669]">Reactivar</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}