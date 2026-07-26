'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, LogIn, LogOut, Clock, Car, Bike, AlertCircle, CheckCircle, X } from 'lucide-react';
import { searchVehicles, registerAccess, getTodayAccessLogs, getAccessHistory } from '@/lib/repository';
import { Vehicle, AccessLog } from '@/lib/types';
import { VEHICLE_TYPE_LABELS } from '@/lib/constants';

export default function AccessPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Vehicle[]>([]);
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [todayLogs, setTodayLogs] = useState<AccessLog[]>([]);
  const [history, setHistory] = useState<AccessLog[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const loadLogs = async () => {
    const [today, hist] = await Promise.all([getTodayAccessLogs(), getAccessHistory(100)]);
    setTodayLogs(today);
    setHistory(hist);
  };

  useEffect(() => { loadLogs(); }, []);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    setSelected(null);
    setMessage(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 1) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await searchVehicles(q);
        setResults(r);
      } catch (e: any) {
        setMessage({ type: 'error', text: e.message });
      } finally {
        setLoading(false);
      }
    }, 250);
  }, []);

  const handleAccess = async (type: 'entry' | 'exit') => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await registerAccess(selected.id, type, selected.license_plate);
      setMessage({ type: 'success', text: `${type === 'entry' ? 'Entrada' : 'Salida'} registrada para ${selected.license_plate}` });
      setSelected(null);
      setQuery('');
      setResults([]);
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

      <Card className="bg-[#1A1A1A] border-[#374151]">
        <CardHeader><CardTitle className="text-white flex items-center gap-2"><Search className="w-5 h-5" /> Buscar Vehículo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Input
              placeholder="Buscar por placa o propietario..."
              value={query}
              onChange={(e) => handleSearch(e.target.value.toUpperCase())}
              className="bg-[#0A0A0A] border-[#374151] text-white font-mono text-lg pr-10"
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults([]); setSelected(null); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {message && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {message.text}
            </div>
          )}

          {loading && <p className="text-slate-400 text-sm">Buscando...</p>}

          {!selected && results.length > 0 && (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {results.map((v) => (
                <button
                  key={v.id}
                  onClick={() => { setSelected(v); setResults([]); }}
                  className="w-full flex items-center justify-between p-3 bg-[#0A0A0A] rounded-lg hover:bg-[#2A2A2A] transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    {v.vehicle_type === 'car' ? <Car className="w-5 h-5 text-[#3B82F6]" /> : <Bike className="w-5 h-5 text-purple-400" />}
                    <div>
                      <p className="text-white font-mono font-bold">{v.license_plate}</p>
                      <p className="text-slate-400 text-sm">{v.owner_name} · Torre {v.tower} · Apto {v.apartment_code}</p>
                    </div>
                  </div>
                  <Badge variant={v.vehicle_type === 'car' ? 'default' : 'secondary'}>{VEHICLE_TYPE_LABELS[v.vehicle_type]}</Badge>
                </button>
              ))}
            </div>
          )}

          {!selected && query && !loading && results.length === 0 && (
            <p className="text-slate-500 text-center py-4 text-sm">No se encontraron vehículos</p>
          )}

          {selected && (
            <div className="p-4 bg-[#0A0A0A] rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selected.vehicle_type === 'car' ? <Car className="w-6 h-6 text-[#3B82F6]" /> : <Bike className="w-6 h-6 text-purple-400" />}
                  <div>
                    <p className="text-white font-mono font-bold text-lg">{selected.license_plate}</p>
                    <p className="text-slate-400 text-sm">{selected.owner_name} · Torre {selected.tower} · Apto {selected.apartment_code}</p>
                  </div>
                </div>
                <Badge variant={selected.vehicle_type === 'car' ? 'default' : 'secondary'}>{VEHICLE_TYPE_LABELS[selected.vehicle_type]}</Badge>
              </div>
              {selected.is_restricted && (
                <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
                  Restringido: {selected.restriction_reason || 'Sin acceso'}
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={() => handleAccess('entry')} disabled={actionLoading || selected.is_restricted} className="flex-1 bg-green-600 hover:bg-green-700">
                  <LogIn className="w-4 h-4 mr-2" /> Entrada
                </Button>
                <Button onClick={() => handleAccess('exit')} disabled={actionLoading || selected.is_restricted} variant="outline" className="flex-1 border-[#374151] text-white hover:bg-slate-700">
                  <LogOut className="w-4 h-4 mr-2" /> Salida
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#1A1A1A] border-[#374151]">
          <CardHeader><CardTitle className="text-white flex items-center gap-2"><Clock className="w-5 h-5" /> Hoy ({todayLogs.length})</CardTitle></CardHeader>
          <CardContent className="max-h-96 overflow-y-auto space-y-2">
            {todayLogs.length === 0 ? (
              <p className="text-slate-400 text-center py-4">Sin registros hoy</p>
            ) : todayLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 p-2 bg-[#0A0A0A] rounded-lg text-sm">
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

        <Card className="bg-[#1A1A1A] border-[#374151]">
          <CardHeader><CardTitle className="text-white flex items-center gap-2"><Clock className="w-5 h-5" /> Historial Reciente</CardTitle></CardHeader>
          <CardContent className="max-h-96 overflow-y-auto space-y-2">
            {history.length === 0 ? (
              <p className="text-slate-400 text-center py-4">Sin registros</p>
            ) : history.map((log) => (
              <div key={log.id} className="flex items-center gap-3 p-2 bg-[#0A0A0A] rounded-lg text-sm">
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
