'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Car, Bike, Edit, Eye, Trash2 } from 'lucide-react';
import { getVehicles, deleteVehicle } from '@/lib/repository';
import { Vehicle, FilterOptions, SortOption } from '@/lib/types';
import { TOWERS, VEHICLE_TYPE_LABELS } from '@/lib/constants';
import { useRealtime } from '@/hooks/useRealtime';

export default function VehiclesPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [sort, setSort] = useState<SortOption>('newest');
  const [search, setSearch] = useState('');

  const loadVehicles = async () => {
    try {
      const data = await getVehicles({ ...filters, search: search || undefined }, sort);
      setVehicles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadVehicles(); }, [filters, sort]);

  useRealtime(['vehicles'], loadVehicles);

  const handleSearch = () => { setFilters({ ...filters }); loadVehicles(); };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este vehículo?')) return;
    await deleteVehicle(id);
    loadVehicles();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Vehículos</h1>
        <Button onClick={() => router.push('/vehicles/new')} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Nuevo Vehículo
        </Button>
      </div>

      <Card className="bg-[#1A1A1A] border-[#374151]">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative sm:col-span-2 lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Buscar por placa, propietario..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9 bg-[#1A1A1A] border-[#374151] text-white"
              />
            </div>
            <select
              value={filters.tower?.toString() || 'all'}
              onChange={(e) => setFilters({ ...filters, tower: e.target.value === 'all' ? undefined : parseInt(e.target.value) })}
              className="flex h-10 sm:h-8 items-center rounded-lg border border-[#374151] bg-[#1A1A1A] px-3 py-1 text-sm text-white"
            >
              <option value="all">Todas las Torres</option>
              {TOWERS.map((t) => <option key={t} value={t}>Torre {t}</option>)}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="flex h-10 sm:h-8 items-center rounded-lg border border-[#374151] bg-[#1A1A1A] px-3 py-1 text-sm text-white"
            >
              <option value="newest">Más recientes</option>
              <option value="oldest">Más antiguos</option>
              <option value="plate_asc">Placa A-Z</option>
              <option value="plate_desc">Placa Z-A</option>
              <option value="tower_asc">Torre ↑</option>
              <option value="tower_desc">Torre ↓</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1A1A1A] border-[#374151]">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Cargando...</div>
          ) : vehicles.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No se encontraron vehículos</div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#374151]">
                      <TableHead className="text-slate-400">Placa</TableHead>
                      <TableHead className="text-slate-400">Tipo</TableHead>
                      <TableHead className="text-slate-400">Torre</TableHead>
                      <TableHead className="text-slate-400">Apto</TableHead>
                      <TableHead className="text-slate-400">Propietario</TableHead>
                      <TableHead className="text-slate-400 text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.map((v) => (
                      <TableRow key={v.id} className="border-[#374151] hover:bg-[#2A2A2A] cursor-pointer transition-colors" onClick={() => router.push(`/vehicles/${v.id}`)}>
                        <TableCell className="font-mono font-bold text-white">{v.license_plate}</TableCell>
                        <TableCell>
                          <Badge variant={v.vehicle_type === 'car' ? 'default' : 'secondary'} className="gap-1">
                            {v.vehicle_type === 'car' ? <Car className="w-3 h-3" /> : <Bike className="w-3 h-3" />}
                            {VEHICLE_TYPE_LABELS[v.vehicle_type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-300">{v.tower}</TableCell>
                        <TableCell className="text-slate-300">{v.apartment_code}</TableCell>
                        <TableCell className="text-slate-300">{v.owner_name}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => router.push(`/vehicles/${v.id}`)} className="text-slate-400 hover:text-white">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => router.push(`/vehicles/${v.id}/edit`)} className="text-slate-400 hover:text-white">
                              <Edit className="w-4 h-4" />
                            </Button>
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
                {vehicles.map((v) => (
                  <div key={v.id} className="p-3 bg-[#0A0A0A] rounded-lg cursor-pointer hover:bg-[#2A2A2A] transition-colors" onClick={() => router.push(`/vehicles/${v.id}`)}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-white">{v.license_plate}</span>
                      <Badge variant={v.vehicle_type === 'car' ? 'default' : 'secondary'} className="gap-1 text-xs">
                        {v.vehicle_type === 'car' ? <Car className="w-3 h-3" /> : <Bike className="w-3 h-3" />}
                        {VEHICLE_TYPE_LABELS[v.vehicle_type]}
                      </Badge>
                    </div>
                    <p className="text-slate-400 text-sm">{v.owner_name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-slate-500 text-xs">Torre {v.tower} · Apto {v.apartment_code}</span>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/vehicles/${v.id}`)} className="text-slate-400 hover:text-white h-7 w-7">
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/vehicles/${v.id}/edit`)} className="text-slate-400 hover:text-white h-7 w-7">
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
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
