'use client';

import { useEffect, useState, useCallback } from 'react';
import { getLicenses, getLicenseDevices, createLicense, updateLicense, setPermanent, extendLicense, deleteLicense } from '@/lib/repository';
import type { License, LicenseDevice } from '@/lib/types';
import { maskLicenseKey } from '@/lib/security';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, RefreshCw, Building2, Calendar, Key, Edit3, Check, X, Infinity, Eye, Search, Smartphone, MonitorSmartphone } from 'lucide-react';

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showExtend, setShowExtend] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
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
  const [search, setSearch] = useState('');
  const [devicesMap, setDevicesMap] = useState<Record<string, LicenseDevice[]>>({});

  const loadData = useCallback(async () => {
    try {
      const lic = await getLicenses();
      setLicenses(lic);
      const allDevices: Record<string, LicenseDevice[]> = {};
      await Promise.all(lic.map(async (l) => {
        const devs = await getLicenseDevices(l.id);
        allDevices[l.id] = devs;
      }));
      setDevicesMap(allDevices);
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

  const handleToggleLicense = async (license: License) => {
    try {
      const updated = await updateLicense(license.id, { active: !license.active });
      setLicenses(prev => prev.map(l => l.id === license.id ? updated : l));
    } catch { }
  };

  const handleCopy = (key: string) => { navigator.clipboard.writeText(key); };

  const getStatus = (license: License) => {
    const isExpired = license.trial_ends_at && new Date(license.trial_ends_at) < new Date();
    if (!license.active) return { label: 'Inactiva', variant: 'destructive' as const };
    if (isExpired) return { label: 'Expirada', variant: 'secondary' as const };
    return { label: 'Activa', variant: 'default' as const };
  };

  const filtered = licenses.filter(l => {
    const q = search.toLowerCase();
    return !q || l.complex_name.toLowerCase().includes(q)
      || l.license_key.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Licencias</h1>
          <p className="text-[#9CA3AF]">{licenses.length} licencias registradas</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Nueva Licencia
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Buscar por nombre o clave..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-[#1A1A1A] border-[#374151] text-white"
        />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>}
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse bg-[#1A1A1A] border-[#374151]">
              <CardContent className="p-6"><div className="h-32" /></CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-[#1A1A1A] border-[#374151]">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="mb-4 h-12 w-12 text-[#374151]" />
            <p className="text-[#9CA3AF]">{search ? 'Sin resultados' : 'Sin licencias registradas'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(license => {
            const isExpired = license.trial_ends_at && new Date(license.trial_ends_at) < new Date();
            const isPermanent = !license.trial_ends_at;
            const status = getStatus(license);
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
                    <code className="flex-1 text-sm font-mono text-[#3B82F6] font-bold tracking-wider">
                      {revealedKeys.has(license.id) ? license.license_key : maskLicenseKey(license.license_key)}
                    </code>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setRevealedKeys(prev => {
                        const next = new Set(prev);
                        if (next.has(license.id)) next.delete(license.id);
                        else next.add(license.id);
                        return next;
                      });
                    }} className="text-[#9CA3AF] hover:text-white" title={revealedKeys.has(license.id) ? 'Ocultar' : 'Revelar'}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(license.license_key)} className="text-[#9CA3AF] hover:text-white">
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>

                  {isEditing ? (
                    <div className="space-y-3 p-3 bg-[#0A0A0A] rounded-lg border border-[#374151]">
                      <div className="space-y-2">
                        <Label className="text-[#9CA3AF] text-xs">Max. dispositivos</Label>
                        <Input type="number" value={editMaxDevices} onChange={e => setEditMaxDevices(e.target.value)} className="bg-[#1A1A1A] border-[#374151] text-white h-8" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-white text-sm">Permanente</Label>
                        <button onClick={() => setEditPermanent(!editPermanent)} className={`w-9 h-5 rounded-full transition-colors ${editPermanent ? 'bg-[#3B82F6]' : 'bg-[#374151]'}`}>
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${editPermanent ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                      {!editPermanent && (
                        <div className="space-y-2">
                          <Label className="text-[#9CA3AF] text-xs">Fecha expiracion</Label>
                          <Input type="date" value={editTrialDate} onChange={e => setEditTrialDate(e.target.value)} className="bg-[#1A1A1A] border-[#374151] text-white h-8" />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="flex-1 border-[#374151] text-white">Cancelar</Button>
                        <Button size="sm" onClick={() => handleSaveEdit(license)} className="flex-1 bg-blue-600 hover:bg-blue-700">Guardar</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-[#9CA3AF]">
                          <Key className="h-3.5 w-3.5" />
                          <span>{license.max_devices} dispositivos</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#9CA3AF]">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{isPermanent ? 'Permanente' : new Date(license.trial_ends_at!).toLocaleDateString('es-CO')}</span>
                        </div>
                      </div>

                      {devicesMap[license.id] && devicesMap[license.id].length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-[#374151]">
                          <p className="text-xs text-[#9CA3AF] font-medium">Dispositivos conectados</p>
                          <div className="space-y-1.5">
                            {devicesMap[license.id].map((device) => (
                              <div key={device.id} className="flex items-center gap-2 p-2 bg-[#0A0A0A] rounded-lg">
                                <div className="w-7 h-7 rounded-md bg-[#3B82F6]/15 flex items-center justify-center shrink-0">
                                  {device.device_name?.toLowerCase().includes('windows') || device.device_name?.toLowerCase().includes('mac') ? (
                                    <MonitorSmartphone className="h-3.5 w-3.5 text-[#3B82F6]" />
                                  ) : (
                                    <Smartphone className="h-3.5 w-3.5 text-[#3B82F6]" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs text-white truncate">{device.device_name || 'Dispositivo'}</p>
                                  <p className="text-[10px] text-[#9CA3AF] font-mono truncate">{device.device_id}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2 border-t border-[#374151]">
                        <Button variant="outline" size="sm" onClick={() => startEdit(license)} className="flex-1 border-[#374151] text-white hover:bg-[#2A2A2A]">
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        {!isPermanent && (
                          <Button variant="outline" size="sm" onClick={() => { setExtendTarget(license); setShowExtend(true); }} className="flex-1 border-[#374151] text-white hover:bg-[#2A2A2A]">
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => handleToggleLicense(license)} className={`flex-1 border-[#374151] ${license.active ? 'text-[#EF4444] hover:bg-[#EF4444]/10' : 'text-[#10B981] hover:bg-[#10B981]/10'}`}>
                          {license.active ? <X className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                        </Button>
                        {!license.active && (
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

      {/* Create dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="bg-[#1A1A1A] border-[#374151] w-full max-w-md mx-4">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">Nueva Licencia</h2>
              <div className="space-y-2">
                <Label className="text-[#9CA3AF]">Nombre del conjunto</Label>
                <Input placeholder="Ej: Villas del Encanto" value={formName} onChange={e => setFormName(e.target.value.slice(0, 100))} className="bg-[#0A0A0A] border-[#374151] text-white" maxLength={100} />
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
                <button onClick={() => setFormPermanent(!formPermanent)} className={`w-9 h-5 rounded-full transition-colors ${formPermanent ? 'bg-[#3B82F6]' : 'bg-[#374151]'}`}>
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
              <h2 className="text-lg font-bold text-white">Extender Licencia</h2>
              <p className="text-[#9CA3AF] text-sm">Extension para: <strong className="text-white">{extendTarget.complex_name}</strong></p>
              <div className="space-y-2">
                <Label className="text-[#9CA3AF]">Dias a agregar</Label>
                <Input type="number" value={extendDays} onChange={e => setExtendDays(e.target.value)} className="bg-[#0A0A0A] border-[#374151] text-white" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setShowExtend(false); setExtendTarget(null); }} className="flex-1 border-[#374151] text-white hover:bg-[#2A2A2A]">Cancelar</Button>
                <Button onClick={handleExtend} className="flex-1 bg-blue-600 hover:bg-blue-700">Extender</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
