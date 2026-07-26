'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Car, Bike, Building, Shield, Activity, Key, CheckCircle, Clock, Smartphone, ChevronRight, Maximize2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { getDashboardStats, getTowerStats, getApartmentViolations, getOccupancyStats, getParkingAlerts, getLicenses, getAllDevices } from '@/lib/repository';
import { DashboardStats, TowerStats, ApartmentViolation, OccupancyStats, ParkingAlert, License, LicenseDevice } from '@/lib/types';
import { getTowerColor } from '@/lib/constants';

const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontSize: '13px',
  },
  cursor: { fill: 'rgba(59, 130, 246, 0.08)' },
};

export default function DashboardPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsAdmin(localStorage.getItem('is_admin') === 'true');
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Panel de Control</h1>
      {isAdmin ? <AdminPanel /> : <UserPanel />}
    </div>
  );
}

function AdminPanel() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [devices, setDevices] = useState<LicenseDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const [l, d] = await Promise.all([getLicenses(), getAllDevices()]);
        setLicenses(l);
        setDevices(d);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSkeleton />;

  const activeLicenses = licenses.filter(l => l.active).length;
  const expiredLicenses = licenses.filter(l => l.active && l.trial_ends_at && new Date(l.trial_ends_at) < new Date()).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Licencias"
          value={licenses.length}
          icon={Key}
          color="text-[#3B82F6]"
          bgColor="bg-[#3B82F6]/15 border-[#3B82F6]/30"
          onClick={() => router.push('/licenses')}
        />
        <StatCard
          title="Activas"
          value={activeLicenses}
          icon={CheckCircle}
          color="text-emerald-400"
          bgColor="bg-emerald-500/15 border-emerald-500/30"
        />
        <StatCard
          title="Expiradas"
          value={expiredLicenses}
          icon={Clock}
          color="text-amber-400"
          bgColor="bg-amber-500/15 border-amber-500/30"
        />
        <StatCard
          title="Dispositivos"
          value={devices.length}
          icon={Smartphone}
          color="text-purple-400"
          bgColor="bg-purple-500/15 border-purple-500/30"
          onClick={() => router.push('/devices')}
        />
      </div>

      <Card className="bg-[#1A1A1A] border-[#374151]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white text-base">Licencias Recientes</CardTitle>
          <button onClick={() => router.push('/licenses')} className="text-[#3B82F6] text-sm hover:text-[#93C5FD] cursor-pointer flex items-center gap-1">
            Ver todas <ChevronRight className="w-4 h-4" />
          </button>
        </CardHeader>
        <CardContent>
          {licenses.length === 0 ? (
            <p className="text-slate-500 text-center py-8 text-sm">Sin licencias registradas</p>
          ) : (
            <div className="space-y-2">
              {licenses.slice(0, 5).map(lic => {
                const isExpired = lic.trial_ends_at && new Date(lic.trial_ends_at) < new Date();
                const badge = !lic.active
                  ? { label: 'Inactiva', cls: 'bg-red-500/20 text-red-400' }
                  : isExpired
                    ? { label: 'Expirada', cls: 'bg-amber-500/20 text-amber-400' }
                    : { label: 'Activa', cls: 'bg-emerald-500/20 text-emerald-400' };
                return (
                  <div key={lic.id} className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg hover:bg-[#2A2A2A] transition-colors cursor-pointer" onClick={() => router.push('/licenses')}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#3B82F6]/20 flex items-center justify-center">
                        <Key className="w-4 h-4 text-[#3B82F6]" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{lic.complex_name}</p>
                        <p className="text-slate-500 text-xs font-mono">{lic.license_key}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${badge.cls}`}>{badge.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#1A1A1A] border-[#374151]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white text-base">Dispositivos Recientes</CardTitle>
          <button onClick={() => router.push('/devices')} className="text-[#3B82F6] text-sm hover:text-[#93C5FD] cursor-pointer flex items-center gap-1">
            Ver todos <ChevronRight className="w-4 h-4" />
          </button>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <p className="text-slate-500 text-center py-8 text-sm">Sin dispositivos registrados</p>
          ) : (
            <div className="space-y-2">
              {devices.slice(0, 5).map(dev => (
                <div key={dev.id} className="flex items-center justify-between p-3 bg-[#1A1A1A] rounded-lg hover:bg-[#2A2A2A] transition-colors cursor-pointer" onClick={() => router.push('/devices')}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Smartphone className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{dev.device_name || 'Desconocido'}</p>
                      <p className="text-slate-500 text-xs">ID: {dev.device_id.substring(0, 12)}...</p>
                    </div>
                  </div>
                  <span className="text-slate-500 text-xs">{new Date(dev.registered_at).toLocaleDateString('es-ES')}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function UserPanel() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [towerStats, setTowerStats] = useState<TowerStats[]>([]);
  const [violations, setViolations] = useState<ApartmentViolation[]>([]);
  const [occupancy, setOccupancy] = useState<OccupancyStats[]>([]);
  const [parkingAlerts, setParkingAlerts] = useState<ParkingAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSection, setOpenSection] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [s, tv, v, o, pa] = await Promise.all([
          getDashboardStats(),
          getTowerStats(),
          getApartmentViolations(),
          getOccupancyStats(),
          getParkingAlerts(),
        ]);
        setStats(s);
        setTowerStats(tv);
        setViolations(v);
        setOccupancy(o);
        setParkingAlerts(pa);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 py-2 shrink-0 h-[13vh]">
        <StatCard title="Total Vehículos" value={stats?.total_vehicles || 0} icon={Car} color="text-[#3B82F6]" bgColor="bg-[#3B82F6]/15 border-[#3B82F6]/30" />
        <StatCard title="Carros" value={stats?.total_cars || 0} icon={Car} color="text-emerald-400" bgColor="bg-emerald-500/15 border-emerald-500/30" />
        <StatCard title="Motos" value={stats?.total_motorcycles || 0} icon={Bike} color="text-purple-400" bgColor="bg-purple-500/15 border-purple-500/30" />
        <StatCard title="Torres" value={14} icon={Building} color="text-amber-400" bgColor="bg-amber-500/15 border-amber-500/30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 shrink-0 h-[43vh]">
        <Card className="bg-[#1A1A1A] border-[#374151] lg:col-span-2 flex flex-col overflow-hidden">
          <CardHeader className="shrink-0 flex flex-row items-center justify-between py-2 px-4">
            <CardTitle className="text-white text-sm">Vehículos por Torre</CardTitle>
            <button onClick={() => setOpenSection('towers')} className="text-slate-400 hover:text-white transition-colors cursor-pointer"><Maximize2 className="w-4 h-4" /></button>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-2 pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={towerStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.12)" />
                <XAxis dataKey="tower" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="total_cars" name="Carros" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total_motorcycles" name="Motos" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-[#374151] flex flex-col overflow-hidden">
          <CardHeader className="shrink-0 flex flex-row items-center justify-between py-2 px-4">
            <CardTitle className="text-white text-sm">Ocupación</CardTitle>
            <button onClick={() => setOpenSection('occupancy')} className="text-slate-400 hover:text-white transition-colors cursor-pointer"><Maximize2 className="w-4 h-4" /></button>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-2 pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancy}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.12)" />
                <XAxis dataKey="tower" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="occupancy_rate" name="Ocupación %" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0 pb-2">
        <Card className="bg-[#1A1A1A] border-[#374151] flex flex-col min-h-0">
          <CardHeader className="shrink-0 flex flex-row items-center justify-between py-2 px-4">
            <CardTitle className="text-white flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-amber-400" />
              Restricciones
            </CardTitle>
            <button onClick={() => setOpenSection('restrictions')} className="text-slate-400 hover:text-white transition-colors cursor-pointer"><Maximize2 className="w-4 h-4" /></button>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-y-auto space-y-1.5 px-4 pb-4">
            {violations.length === 0 ? (
              <p className="text-slate-500 text-center py-4 text-sm">No hay restricciones</p>
            ) : violations.slice(0, 5).map((v) => (
              <div key={v.apartment_code} className="flex items-center justify-between p-2.5 bg-[#0A0A0A] rounded-lg">
                <div>
                  <p className="text-white font-medium text-sm">Torre {v.tower} - Apto {v.apartment_code}</p>
                  <p className="text-slate-500 text-xs">{v.car_count} carro(s), {v.motorcycle_count} moto(s)</p>
                </div>
                <span className="text-amber-400 font-bold text-sm">{v.vehicle_count} vehículos</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-[#374151] flex flex-col min-h-0">
          <CardHeader className="shrink-0 flex flex-row items-center justify-between py-2 px-4">
            <CardTitle className="text-white flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-orange-400" />
              Estacionamiento +1 Mes
            </CardTitle>
            <button onClick={() => setOpenSection('parking')} className="text-slate-400 hover:text-white transition-colors cursor-pointer"><Maximize2 className="w-4 h-4" /></button>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-y-auto space-y-1.5 px-4 pb-4">
            {parkingAlerts.length === 0 ? (
              <p className="text-slate-500 text-center py-4 text-sm">No hay alertas</p>
            ) : parkingAlerts.slice(0, 5).map((a) => (
              <div key={a.vehicle_id} className="flex items-center justify-between p-2.5 bg-[#0A0A0A] rounded-lg">
                <div>
                  <p className="text-white font-medium text-sm">{a.license_plate} — {a.owner_name}</p>
                  <p className="text-slate-500 text-xs">Torre {a.tower} · Apto {a.apartment_code}</p>
                </div>
                <span className="text-orange-400 font-bold text-sm">{a.days_parked} días</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={openSection === 'towers'} onOpenChange={(o) => { if (!o) setOpenSection(null); }}>
        <DialogContent className="bg-[#1A1A1A] border-[#374151] w-[92vw] h-[88vh] max-w-none p-6 flex flex-col">
          <DialogHeader className="shrink-0"><DialogTitle className="text-white text-xl">Vehículos por Torre</DialogTitle></DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={towerStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.12)" />
                <XAxis dataKey="tower" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="total_cars" name="Carros" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total_motorcycles" name="Motos" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-4">
              {towerStats.map((t) => (
                <div key={t.tower} className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded-lg">
                  <span className="text-white font-medium text-sm">Torre {t.tower}</span>
                  <span className="text-slate-400 text-sm">{t.total_cars}C · {t.total_motorcycles}M</span>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openSection === 'occupancy'} onOpenChange={(o) => { if (!o) setOpenSection(null); }}>
        <DialogContent className="bg-[#1A1A1A] border-[#374151] w-[92vw] h-[88vh] max-w-none p-6 flex flex-col">
          <DialogHeader className="shrink-0"><DialogTitle className="text-white text-xl">Ocupación por Torre</DialogTitle></DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={occupancy}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.12)" />
                <XAxis dataKey="tower" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="occupancy_rate" name="Ocupación %" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-4">
              {occupancy.map((o) => (
                <div key={o.tower} className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded-lg">
                  <span className="text-white font-medium text-sm">Torre {o.tower}</span>
                  <span className="text-emerald-400 font-bold text-sm">{o.occupancy_rate}%</span>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openSection === 'restrictions'} onOpenChange={(o) => { if (!o) setOpenSection(null); }}>
        <DialogContent className="bg-[#1A1A1A] border-[#374151] w-[80vw] h-[85vh] max-w-none p-6 flex flex-col">
          <DialogHeader className="shrink-0"><DialogTitle className="text-white text-xl flex items-center gap-2"><Shield className="w-5 h-5 text-amber-400" /> Restricciones</DialogTitle></DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
            {violations.length === 0 ? (
              <p className="text-slate-500 text-center py-8 text-sm">No hay restricciones registradas</p>
            ) : violations.map((v) => (
              <div key={v.apartment_code} className="flex items-center justify-between p-4 bg-[#0A0A0A] rounded-lg">
                <div>
                  <p className="text-white font-medium">Torre {v.tower} - Apto {v.apartment_code}</p>
                  <p className="text-slate-500 text-sm">{v.car_count} carro(s), {v.motorcycle_count} moto(s)</p>
                </div>
                <span className="text-amber-400 font-bold">{v.vehicle_count} vehículos</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openSection === 'parking'} onOpenChange={(o) => { if (!o) setOpenSection(null); }}>
        <DialogContent className="bg-[#1A1A1A] border-[#374151] w-[80vw] h-[85vh] max-w-none p-6 flex flex-col">
          <DialogHeader className="shrink-0"><DialogTitle className="text-white text-xl flex items-center gap-2"><Activity className="w-5 h-5 text-orange-400" /> Vehículos con +1 Mes Estacionados</DialogTitle></DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
            {parkingAlerts.length === 0 ? (
              <p className="text-slate-500 text-center py-8 text-sm">No hay alertas de estacionamiento</p>
            ) : parkingAlerts.map((a) => (
              <div key={a.vehicle_id} className="flex items-center justify-between p-4 bg-[#0A0A0A] rounded-lg">
                <div>
                  <p className="text-white font-medium">{a.license_plate} — {a.owner_name}</p>
                  <p className="text-slate-500 text-sm">Torre {a.tower} · Apto {a.apartment_code}</p>
                </div>
                <span className="text-orange-400 font-bold">{a.days_parked} días</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bgColor, onClick }: {
  title: string; value: number; icon: any; color: string; bgColor?: string; onClick?: () => void;
}) {
  return (
    <Card
      className={`${bgColor || 'bg-[#3B82F6]/15 border-[#3B82F6]/30'} ${onClick ? 'cursor-pointer hover:scale-[1.02] transition-transform' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
          <Icon className={`w-8 h-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 bg-[#1A1A1A] rounded w-48 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-[#1A1A1A] rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="h-96 bg-[#1A1A1A] rounded-lg animate-pulse" />
    </div>
  );
}
