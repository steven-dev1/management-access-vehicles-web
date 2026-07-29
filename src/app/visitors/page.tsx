'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Users, LogIn, LogOut, Trash2 } from 'lucide-react';
import { getVisitors, createVisitor, checkInVisitor, checkOutVisitor, deleteVisitor } from '@/lib/repository';
import { Visitor, VisitorFormData, VisitorStatus } from '@/lib/types';
import { TOWERS, APARTMENTS_PER_FLOOR, generateApartmentCode } from '@/lib/constants';
import { useRealtime } from '@/hooks/useRealtime';

const STATUS_LABELS: Record<VisitorStatus, string> = {
  expected: 'Esperado',
  active: 'Activo',
  completed: 'Completado',
  expired: 'Expirado',
};

const STATUS_COLORS: Record<VisitorStatus, string> = {
  expected: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  active: 'bg-green-500/10 text-green-400 border-green-500/30',
  completed: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  expired: 'bg-red-500/10 text-red-400 border-red-500/30',
};

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<VisitorFormData>({
    visitor_plate: '', visitor_name: '', host_tower: 1, host_apartment_code: '1',
    host_owner_name: '', purpose: '', expected_duration_hours: 2,
  });

  const loadVisitors = async () => {
    try {
      const data = await getVisitors();
      setVisitors(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadVisitors(); }, []);

  useRealtime(['visitors'], loadVisitors);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createVisitor(form);
      setShowForm(false);
      setForm({ visitor_plate: '', visitor_name: '', host_tower: 1, host_apartment_code: '1', host_owner_name: '', purpose: '', expected_duration_hours: 2 });
      loadVisitors();
    } catch (e: any) { alert(e.message); }
    finally { setCreating(false); }
  };

  const handleCheckIn = async (id: string) => { await checkInVisitor(id); loadVisitors(); };
  const handleCheckOut = async (id: string) => { await checkOutVisitor(id); loadVisitors(); };
  const handleDelete = async (id: string) => { if (confirm('¿Eliminar?')) { await deleteVisitor(id); loadVisitors(); } };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Visitantes</h1>
        <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> {showForm ? 'Cancelar' : 'Nuevo Visitante'}
        </Button>
      </div>

      {showForm && (
        <Card className="bg-[#1A1A1A] border-[#374151]">
          <CardHeader><CardTitle className="text-white">Registrar Visitante</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Placa</Label>
                  <Input value={form.visitor_plate} onChange={(e) => setForm({ ...form, visitor_plate: e.target.value.toUpperCase().slice(0, 10) })} className="bg-[#1A1A1A] border-[#374151] text-white" maxLength={10} required />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Nombre</Label>
                  <Input value={form.visitor_name} onChange={(e) => setForm({ ...form, visitor_name: e.target.value.slice(0, 100) })} className="bg-[#1A1A1A] border-[#374151] text-white" maxLength={100} required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Torre</Label>
                  <select value={form.host_tower} onChange={(e) => setForm({ ...form, host_tower: parseInt(e.target.value) })} className="flex h-10 sm:h-8 w-full items-center rounded-lg border border-[#374151] bg-[#1A1A1A] px-3 py-1 text-sm text-white">
                    {TOWERS.map((t) => <option key={t} value={t}>Torre {t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Apto</Label>
                  <select value={form.host_apartment_code} onChange={(e) => setForm({ ...form, host_apartment_code: e.target.value })} className="flex h-10 sm:h-8 w-full items-center rounded-lg border border-[#374151] bg-[#1A1A1A] px-3 py-1 text-sm text-white">
                    {APARTMENTS_PER_FLOOR.map((a) => {
                      const code = generateApartmentCode(form.host_tower, a);
                      return <option key={a} value={a.toString()}>Apto {code}</option>;
                    })}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Propietario anfitrión</Label>
                <Input value={form.host_owner_name} onChange={(e) => setForm({ ...form, host_owner_name: e.target.value })} className="bg-[#1A1A1A] border-[#374151] text-white" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Propósito</Label>
                  <Input value={form.purpose || ''} onChange={(e) => setForm({ ...form, purpose: e.target.value.slice(0, 100) })} className="bg-[#1A1A1A] border-[#374151] text-white" maxLength={100} />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Duración (horas)</Label>
                  <Input type="number" value={form.expected_duration_hours} onChange={(e) => setForm({ ...form, expected_duration_hours: parseInt(e.target.value) || 1 })} className="bg-[#1A1A1A] border-[#374151] text-white" min={1} />
                </div>
              </div>
              <Button type="submit" disabled={creating} className="w-full bg-blue-600 hover:bg-blue-700">
                {creating ? 'Creando...' : 'Registrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-[#1A1A1A] border-[#374151]">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Cargando...</div>
          ) : visitors.length === 0 ? (
            <div className="p-8 text-center text-slate-400"><Users className="w-12 h-12 mx-auto mb-2 opacity-50" />No hay visitantes registrados</div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#374151]">
                      <TableHead className="text-slate-400">Placa</TableHead>
                      <TableHead className="text-slate-400">Nombre</TableHead>
                      <TableHead className="text-slate-400">Anfitrión</TableHead>
                      <TableHead className="text-slate-400">Estado</TableHead>
                      <TableHead className="text-slate-400">Registro</TableHead>
                      <TableHead className="text-slate-400 text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visitors.map((v) => (
                      <TableRow key={v.id} className="border-[#374151]">
                        <TableCell className="font-mono font-bold text-white">{v.visitor_plate}</TableCell>
                        <TableCell className="text-slate-300">{v.visitor_name}</TableCell>
                        <TableCell className="text-slate-300">{v.host_owner_name}</TableCell>
                        <TableCell><Badge variant="outline" className={STATUS_COLORS[v.status]}>{STATUS_LABELS[v.status]}</Badge></TableCell>
                        <TableCell className="text-slate-400 text-sm">{new Date(v.created_at).toLocaleDateString('es-CO')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {v.status === 'expected' && (
                              <Button variant="ghost" size="icon" onClick={() => handleCheckIn(v.id)} className="text-green-400 hover:text-green-300">
                                <LogIn className="w-4 h-4" />
                              </Button>
                            )}
                            {v.status === 'active' && (
                              <Button variant="ghost" size="icon" onClick={() => handleCheckOut(v.id)} className="text-yellow-400 hover:text-yellow-300">
                                <LogOut className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)} className="text-red-400 hover:text-red-300">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden space-y-2 p-3">
                {visitors.map((v) => (
                  <div key={v.id} className="p-3 bg-[#0A0A0A] rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-white">{v.visitor_plate}</span>
                      <Badge variant="outline" className={`${STATUS_COLORS[v.status]} text-xs`}>{STATUS_LABELS[v.status]}</Badge>
                    </div>
                    <p className="text-slate-400 text-sm">{v.visitor_name}</p>
                    <p className="text-slate-500 text-xs">Anfitrión: {v.host_owner_name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-slate-500 text-xs">{new Date(v.created_at).toLocaleDateString('es-CO')}</span>
                      <div className="flex gap-1">
                        {v.status === 'expected' && (
                          <Button variant="ghost" size="icon" onClick={() => handleCheckIn(v.id)} className="text-green-400 hover:text-green-300 h-7 w-7">
                            <LogIn className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {v.status === 'active' && (
                          <Button variant="ghost" size="icon" onClick={() => handleCheckOut(v.id)} className="text-yellow-400 hover:text-yellow-300 h-7 w-7">
                            <LogOut className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)} className="text-red-400 hover:text-red-300 h-7 w-7">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
