'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Car, Bike, Clock, LogIn, LogOut } from 'lucide-react';
import { getVehicleById, getAccessHistory } from '@/lib/repository';
import { Vehicle, AccessLog } from '@/lib/types';
import { VEHICLE_TYPE_LABELS, getTowerColor } from '@/lib/constants';

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const v = await getVehicleById(id);
        setVehicle(v);
        if (v) {
          const logs = await getAccessHistory(50);
          setAccessLogs(logs.filter((l) => l.vehicle_id === id));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-400">Cargando...</div>;
  if (!vehicle) return <div className="p-8 text-center text-slate-400">Vehículo no encontrado</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-slate-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-white">{vehicle.license_plate}</h1>
        <Button variant="outline" size="sm" onClick={() => router.push(`/vehicles/${id}/edit`)} className="ml-auto border-slate-600 text-white">
          <Edit className="w-4 h-4 mr-2" /> Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-slate-900/60 border-blue-800/30">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              {vehicle.vehicle_type === 'car' ? <Car className="w-8 h-8 text-blue-400" /> : <Bike className="w-8 h-8 text-purple-400" />}
              <div>
                <p className="text-white font-bold text-lg">{vehicle.license_plate}</p>
                <Badge variant={vehicle.vehicle_type === 'car' ? 'default' : 'secondary'}>{VEHICLE_TYPE_LABELS[vehicle.vehicle_type]}</Badge>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Torre</span><span className="text-white">{vehicle.tower}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Piso</span><span className="text-white">{vehicle.floor}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Apartamento</span><span className="text-white">{vehicle.apartment_code}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Propietario</span><span className="text-white">{vehicle.owner_name}</span></div>
            </div>
            {vehicle.is_restricted && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm font-medium">Restringido</p>
                {vehicle.restriction_reason && <p className="text-red-300/70 text-xs mt-1">{vehicle.restriction_reason}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-slate-900/60 border-blue-800/30">
          <CardHeader><CardTitle className="text-white flex items-center gap-2"><Clock className="w-5 h-5" /> Historial de Acceso</CardTitle></CardHeader>
          <CardContent>
            {accessLogs.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Sin registros de acceso</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {accessLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 p-3 bg-blue-900/15 rounded-lg">
                    {log.access_type === 'entry' ? (
                      <LogIn className="w-4 h-4 text-green-400" />
                    ) : (
                      <LogOut className="w-4 h-4 text-red-400" />
                    )}
                    <div className="flex-1">
                      <p className="text-white text-sm">{log.access_type === 'entry' ? 'Entrada' : 'Salida'}</p>
                      <p className="text-slate-400 text-xs">{new Date(log.timestamp).toLocaleString('es-CO')}</p>
                    </div>
                    {log.plate_scanned && <span className="text-slate-500 text-xs font-mono">{log.plate_scanned}</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
