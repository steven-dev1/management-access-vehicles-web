'use client';

import { useEffect, useState, useCallback } from 'react';
import { getLicenses, getLicenseDevices, toggleLicenseDevice } from '@/lib/repository';
import type { License, LicenseDevice } from '@/lib/types';
import { maskLicenseKey, maskDeviceId } from '@/lib/security';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Smartphone, X, Calendar, Key, Power, PowerOff, Search } from 'lucide-react';

export default function DevicesPage() {
  const [devices, setDevices] = useState<(LicenseDevice & { complex_name?: string; license_key?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = useCallback(async () => {
    try {
      const lic = await getLicenses();
      const allDevices: (LicenseDevice & { complex_name?: string; license_key?: string })[] = [];
      for (const l of lic) {
        const devs = await getLicenseDevices(l.id);
        allDevices.push(...devs.map(d => ({ ...d, complex_name: l.complex_name, license_key: l.license_key })));
      }
      setDevices(allDevices);
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggle = async (device: LicenseDevice & { complex_name?: string }) => {
    if (!confirm(`¿${device.active ? 'Desactivar' : 'Activar'} "${device.device_name}" de ${device.complex_name}?`)) return;
    try {
      await toggleLicenseDevice(device.id, !device.active);
      setDevices(prev => prev.map(d => d.id === device.id ? { ...d, active: !d.active } : d));
    } catch { }
  };

  const filtered = devices.filter(d => {
    const q = search.toLowerCase();
    return !q || (d.device_name || '').toLowerCase().includes(q)
      || (d.complex_name || '').toLowerCase().includes(q)
      || (d.device_id || '').toLowerCase().includes(q)
      || (d.license_key || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dispositivos</h1>
          <p className="text-slate-400">{devices.length} dispositivos registrados</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Buscar por nombre, conjunto, ID o licencia..."
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
              <CardContent className="p-6"><div className="h-24" /></CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-[#1A1A1A] border-[#374151]">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Smartphone className="mb-4 h-12 w-12 text-slate-600" />
            <p className="text-slate-400">{search ? 'Sin resultados' : 'Sin dispositivos registrados'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(device => {
            const isRecent = new Date(device.registered_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return (
              <Card key={device.id} className={`bg-[#1A1A1A] border-[#374151] ${!device.active ? 'opacity-60' : ''}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${device.active ? (isRecent ? 'bg-green-500/10' : 'bg-[#1A1A1A]') : 'bg-red-500/10'}`}>
                        <Smartphone className={`h-5 w-5 ${device.active ? (isRecent ? 'text-green-400' : 'text-slate-400') : 'text-red-400'}`} />
                      </div>
                      <div>
                        <p className={`font-medium ${device.active ? 'text-white' : 'text-slate-400'}`}>{device.device_name || 'Desconocido'}</p>
                        {device.complex_name && <p className="text-sm text-[#3B82F6]">{device.complex_name}</p>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleToggle(device)} className="text-slate-400 hover:text-white">
                      {device.active ? <PowerOff className="h-4 w-4 text-red-400" /> : <Power className="h-4 w-4 text-green-400" />}
                    </Button>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <Key className="h-3.5 w-3.5" />
                      <code className="font-mono text-xs">{maskLicenseKey(device.license_key || '')}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(device.registered_at).toLocaleDateString('es-CO')}</span>
                    </div>
                  </div>
                  <p className="mt-3 truncate text-xs text-slate-600">ID: {maskDeviceId(device.device_id)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
