'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car, Bike, Building, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { getDashboardStats, getTowerStats, getApartmentViolations, getOccupancyStats, getParkingAlerts } from '@/lib/repository';
import { DashboardStats, TowerStats, ApartmentViolation, OccupancyStats, ParkingAlert } from '@/lib/types';
import { getTowerColor } from '@/lib/constants';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [towerStats, setTowerStats] = useState<TowerStats[]>([]);
  const [violations, setViolations] = useState<ApartmentViolation[]>([]);
  const [occupancy, setOccupancy] = useState<OccupancyStats[]>([]);
  const [parkingAlerts, setParkingAlerts] = useState<ParkingAlert[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Panel de Control</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Vehículos" value={stats?.total_vehicles || 0} icon={Car} color="text-blue-400" />
        <StatCard title="Carros" value={stats?.total_cars || 0} icon={Car} color="text-green-400" />
        <StatCard title="Motos" value={stats?.total_motorcycles || 0} icon={Bike} color="text-purple-400" />
        <StatCard title="Torres" value={14} icon={Building} color="text-yellow-400" />
      </div>

      <Tabs defaultValue="towers" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="towers">Por Torre</TabsTrigger>
          <TabsTrigger value="violations">Violaciones</TabsTrigger>
          <TabsTrigger value="occupancy">Ocupación</TabsTrigger>
          <TabsTrigger value="parking">Estacionamiento</TabsTrigger>
        </TabsList>

        <TabsContent value="towers">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader><CardTitle className="text-white">Vehículos por Torre</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={towerStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="tower" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="total_cars" name="Carros" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total_motorcycles" name="Motos" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Apartamentos con Más Vehículos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {violations.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No hay violaciones registradas</p>
              ) : (
                <div className="space-y-3">
                  {violations.map((v) => (
                    <div key={v.apartment_code} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Torre {v.tower} - Apto {v.apartment_code}</p>
                        <p className="text-slate-400 text-sm">{v.car_count} carro(s), {v.motorcycle_count} moto(s)</p>
                      </div>
                      <span className="text-yellow-400 font-bold">{v.vehicle_count} vehículos</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="occupancy">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader><CardTitle className="text-white">Ocupación por Torre</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={occupancy}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="tower" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="occupancy_rate" name="Ocupación %" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parking">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-400" />
                Vehículos con Más de 2 Días Estacionados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {parkingAlerts.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No hay alertas de estacionamiento</p>
              ) : (
                <div className="space-y-3">
                  {parkingAlerts.map((a) => (
                    <div key={a.vehicle_id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{a.license_plate} — {a.owner_name}</p>
                        <p className="text-slate-400 text-sm">Torre {a.tower} · Apto {a.apartment_code}</p>
                      </div>
                      <span className="text-orange-400 font-bold">{a.days_parked} días</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: string }) {
  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
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
      <div className="h-8 bg-slate-800 rounded w-48 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-slate-800 rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="h-96 bg-slate-800 rounded-lg animate-pulse" />
    </div>
  );
}
