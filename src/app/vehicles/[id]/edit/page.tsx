'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { getVehicleById, updateVehicle } from '@/lib/repository';
import { VehicleFormData } from '@/lib/types';
import { TOWERS, FLOORS, APARTMENTS_PER_FLOOR } from '@/lib/constants';

export default function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<VehicleFormData>({
    license_plate: '', vehicle_type: 'car', tower: 1, floor: 1, apartment: 1,
    owner_name: '', is_restricted: false, restriction_reason: '',
  });

  useEffect(() => {
    getVehicleById(id).then((v) => {
      if (v) setForm({
        license_plate: v.license_plate, vehicle_type: v.vehicle_type, tower: v.tower,
        floor: v.floor, apartment: v.apartment, owner_name: v.owner_name,
        is_restricted: v.is_restricted, restriction_reason: v.restriction_reason || '',
      });
      setLoading(false);
    });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateVehicle(id, form);
      router.push(`/vehicles/${id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-slate-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-white">Editar Vehículo</h1>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50 max-w-2xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="space-y-2">
              <Label className="text-slate-300">Placa</Label>
              <Input value={form.license_plate} onChange={(e) => setForm({ ...form, license_plate: e.target.value.toUpperCase() })} className="bg-slate-700/50 border-slate-600 text-white" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Tipo</Label>
                <select value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value as VehicleFormData['vehicle_type'] })} className="flex h-8 w-full items-center rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-1 text-sm text-white">
                  <option value="car">Carro</option>
                  <option value="motorcycle">Moto</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Torre</Label>
                <select value={form.tower} onChange={(e) => setForm({ ...form, tower: parseInt(e.target.value) })} className="flex h-8 w-full items-center rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-1 text-sm text-white">
                  {TOWERS.map((t) => <option key={t} value={t}>Torre {t}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Piso</Label>
                <select value={form.floor} onChange={(e) => setForm({ ...form, floor: parseInt(e.target.value) })} className="flex h-8 w-full items-center rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-1 text-sm text-white">
                  {FLOORS.map((f) => <option key={f} value={f}>Piso {f}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Apartamento</Label>
                <select value={form.apartment} onChange={(e) => setForm({ ...form, apartment: parseInt(e.target.value) })} className="flex h-8 w-full items-center rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-1 text-sm text-white">
                  {APARTMENTS_PER_FLOOR.map((a) => <option key={a} value={a}>Apto {a}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Propietario</Label>
              <Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} className="bg-slate-700/50 border-slate-600 text-white" required />
            </div>

            <Button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Cambios'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
