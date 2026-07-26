'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, LogIn, LogOut, Clock, Car, Bike, AlertCircle, CheckCircle } from 'lucide-react';
import { searchVehicleByPlate, registerAccess, getTodayAccessLogs, getAccessHistory } from '@/lib/repository';
import { Vehicle, AccessLog } from '@/lib/types';
import { VEHICLE_TYPE_LABELS } from '@/lib/constants';

export default function AccessPage() {
  const [plate, setPlate] = useState('');
  const [searchResult, setSearchResult] = useState<Vehicle | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [todayLogs, setTodayLogs] = useState<AccessLog[]>([]);
  const [history, setHistory] = useState<AccessLog[]>([]);

  const loadLogs = async () => {
    const [today, hist] = await Promise.all([getTodayAccessLogs(), getAccessHistory(100)]);
    setTodayLogs(today);
    setHistory(hist);
  };

  useEffect(() => { loadLogs(); }, []);

  const handleSearch = async () => {
    if (!plate.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const v = await searchVehicleByPlate(plate);
      setSearchResult(v);
      setSearched(true);
      if (!v) setMessage({ type: 'error', text: `No se encontró vehículo con placa "${plate.toUpperCase()}"` });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAccess = async (type: 'entry' | 'exit') => {
    if (!searchResult) return;
    setActionLoading(true);
    try {
      await registerAccess(searchResult.id, type, plate.toUpperCase());
      setMessage({ type: 'success', text: `${type === 'entry' ? 'Entrada' : 'Salida'} registrada para ${searchResult.license_plate}` });
      setSearchResult(null);
      setPlate('');
      setSearched(false);
      loadLogs();
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Control de Acceso</h1>

      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader><CardTitle className="text-white flex items-center gap-2"><Search className="w-5 h-5" /> Buscar Vehículo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Ingrese la placa..."
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="bg-slate-700/50 border-slate-600 text-white font-mono text-lg"
            />
            <Button onClick={handleSearch} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {message && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {message.text}
            </div>
          )}

          {searchResult && (
            <div className="p-4 bg-slate-700/30 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {searchResult.vehicle_type === 'car' ? <Car className="w-6 h-6 text-blue-400" /> : <Bike className="w-6 h-6 text-purple-400" />}
                  <div>
                    <p className="text-white font-mono font-bold text-lg">{searchResult.license_plate}</p>
                    <p className="text-slate-400 text-sm">{searchResult.owner_name} · Torre {searchResult.tower} · Apto {searchResult.apartment_code}</p>
                  </div>
                </div>
                <Badge variant={searchResult.vehicle_type === 'car' ? 'default' : 'secondary'}>{VEHICLE_TYPE_LABELS[searchResult.vehicle_type]}</Badge>
              </div>
              {searchResult.is_restricted && (
                <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                  ⚠ Restringido: {searchResult.restriction_reason || 'Sin acceso'}
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={() => handleAccess('entry')} disabled={actionLoading || searchResult.is_restricted} className="flex-1 bg-green-600 hover:bg-green-700">
                  <LogIn className="w-4 h-4 mr-2" /> Entrada
                </Button>
                <Button onClick={() => handleAccess('exit')} disabled={actionLoading || searchResult.is_restricted} variant="outline" className="flex-1 border-slate-600 text-white hover:bg-slate-700">
                  <LogOut className="w-4 h-4 mr-2" /> Salida
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader><CardTitle className="text-white flex items-center gap-2"><Clock className="w-5 h-5" /> Hoy ({todayLogs.length})</CardTitle></CardHeader>
          <CardContent className="max-h-96 overflow-y-auto space-y-2">
            {todayLogs.length === 0 ? (
              <p className="text-slate-400 text-center py-4">Sin registros hoy</p>
            ) : todayLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 p-2 bg-slate-700/20 rounded-lg text-sm">
                {log.access_type === 'entry' ? <LogIn className="w-4 h-4 text-green-400" /> : <LogOut className="w-4 h-4 text-red-400" />}
                <div className="flex-1">
                  <span className="text-white font-mono">{(log as any).vehicles?.license_plate || 'N/A'}</span>
                  <span className="text-slate-400 ml-2">{log.access_type === 'entry' ? 'Entrada' : 'Salida'}</span>
                </div>
                <span className="text-slate-500 text-xs">{new Date(log.timestamp).toLocaleTimeString('es-CO')}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader><CardTitle className="text-white flex items-center gap-2"><Clock className="w-5 h-5" /> Historial Reciente</CardTitle></CardHeader>
          <CardContent className="max-h-96 overflow-y-auto space-y-2">
            {history.length === 0 ? (
              <p className="text-slate-400 text-center py-4">Sin registros</p>
            ) : history.map((log) => (
              <div key={log.id} className="flex items-center gap-3 p-2 bg-slate-700/20 rounded-lg text-sm">
                {log.access_type === 'entry' ? <LogIn className="w-4 h-4 text-green-400" /> : <LogOut className="w-4 h-4 text-red-400" />}
                <div className="flex-1">
                  <span className="text-white font-mono">{(log as any).vehicles?.license_plate || 'N/A'}</span>
                  <span className="text-slate-400 ml-2">{log.access_type === 'entry' ? 'Entrada' : 'Salida'}</span>
                </div>
                <span className="text-slate-500 text-xs">{new Date(log.timestamp).toLocaleString('es-CO')}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
