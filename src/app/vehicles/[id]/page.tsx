'use client';

import { useEffect, useState, useRef, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Car, Bike, Clock, LogIn, LogOut, Upload, X, ChevronLeft, ChevronRight, Trash2, ImageIcon } from 'lucide-react';
import { getVehicleById, getAccessHistory, uploadVehicleImage, deleteVehicleImage, updateVehicleImages } from '@/lib/repository';
import { Vehicle, AccessLog } from '@/lib/types';
import { VEHICLE_TYPE_LABELS } from '@/lib/constants';

const MAX_IMAGES = 3;

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !vehicle) return;
    if ((vehicle.images?.length || 0) >= MAX_IMAGES) {
      alert(`Maximo ${MAX_IMAGES} fotos`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no puede superar 5MB');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadVehicleImage(vehicle.id, file);
      const newImages = [...(vehicle.images || []), url];
      await updateVehicleImages(vehicle.id, newImages);
      setVehicle({ ...vehicle, images: newImages });
    } catch (err) {
      console.error(err);
      alert('Error al subir la imagen');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteImage = async (index: number) => {
    if (!vehicle || !confirm('Eliminar esta foto?')) return;
    const imageUrl = vehicle.images[index];
    try {
      await deleteVehicleImage(imageUrl);
      const newImages = vehicle.images.filter((_, i) => i !== index);
      await updateVehicleImages(vehicle.id, newImages);
      setVehicle({ ...vehicle, images: newImages });
      if (lightboxOpen) {
        if (newImages.length === 0) setLightboxOpen(false);
        else if (lightboxIndex >= newImages.length) setLightboxIndex(newImages.length - 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const prevImage = useCallback(() => {
    if (!vehicle) return;
    setLightboxIndex((i) => (i > 0 ? i - 1 : (vehicle.images?.length || 1) - 1));
  }, [vehicle]);

  const nextImage = useCallback(() => {
    if (!vehicle) return;
    setLightboxIndex((i) => (i < (vehicle.images?.length || 1) - 1 ? i + 1 : 0));
  }, [vehicle]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxOpen, prevImage, nextImage]);

  if (loading) return <div className="p-8 text-center text-slate-400">Cargando...</div>;
  if (!vehicle) return <div className="p-8 text-center text-slate-400">Vehiculo no encontrado</div>;

  const images = vehicle.images || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-slate-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-white">{vehicle.license_plate}</h1>
        <Button variant="outline" size="sm" onClick={() => router.push(`/vehicles/${id}/edit`)} className="ml-auto border-[#374151] text-white hover:bg-[#2A2A2A]">
          <Edit className="w-4 h-4 mr-2" /> Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-[#1A1A1A] border-[#374151]">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              {vehicle.vehicle_type === 'car' ? <Car className="w-8 h-8 text-[#3B82F6]" /> : <Bike className="w-8 h-8 text-purple-400" />}
              <div>
                <p className="text-white font-bold text-lg">{vehicle.license_plate}</p>
                <Badge variant={vehicle.vehicle_type === 'car' ? 'default' : 'secondary'}>{VEHICLE_TYPE_LABELS[vehicle.vehicle_type]}</Badge>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[#9CA3AF]">Torre</span><span className="text-white">{vehicle.tower}</span></div>
              <div className="flex justify-between"><span className="text-[#9CA3AF]">Piso</span><span className="text-white">{vehicle.floor}</span></div>
              <div className="flex justify-between"><span className="text-[#9CA3AF]">Apartamento</span><span className="text-white">{vehicle.apartment_code}</span></div>
              <div className="flex justify-between"><span className="text-[#9CA3AF]">Propietario</span><span className="text-white">{vehicle.owner_name}</span></div>
            </div>
            {vehicle.is_restricted && (
              <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg">
                <p className="text-[#EF4444] text-sm font-medium">Restringido</p>
                {vehicle.restriction_reason && <p className="text-red-300/70 text-xs mt-1">{vehicle.restriction_reason}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-[#1A1A1A] border-[#374151]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5" /> Fotos ({images.length}/{MAX_IMAGES})
              </CardTitle>
              {images.length < MAX_IMAGES && (
                <>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    className="border-[#374151] text-white hover:bg-[#2A2A2A]">
                    <Upload className="w-4 h-4 mr-1" /> {uploading ? 'Subiendo...' : 'Subir foto'}
                  </Button>
                  <span className="text-[10px] text-[#374151]">Max. 5MB</span>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {images.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#9CA3AF]">
                <ImageIcon className="w-12 h-12 mb-3 text-[#374151]" />
                <p className="text-sm">Sin fotos</p>
                <p className="text-xs text-[#374151] mt-1">Sube una foto del vehiculo</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((url, index) => (
                  <div key={index} className="relative group aspect-video rounded-lg overflow-hidden bg-[#0A0A0A] cursor-pointer" onClick={() => openLightbox(index)}>
                    <img src={url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">Ver</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteImage(index); }}
                      className="absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-[#EF4444] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#1A1A1A] border-[#374151]">
        <CardHeader><CardTitle className="text-white flex items-center gap-2"><Clock className="w-5 h-5" /> Historial de Acceso</CardTitle></CardHeader>
        <CardContent>
          {accessLogs.length === 0 ? (
            <p className="text-[#9CA3AF] text-center py-8">Sin registros de acceso</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {accessLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-3 bg-[#0A0A0A] rounded-lg">
                  {log.access_type === 'entry' ? (
                    <LogIn className="w-4 h-4 text-[#10B981]" />
                  ) : (
                    <LogOut className="w-4 h-4 text-[#EF4444]" />
                  )}
                  <div className="flex-1">
                    <p className="text-white text-sm">{log.access_type === 'entry' ? 'Entrada' : 'Salida'}</p>
                    <p className="text-[#9CA3AF] text-xs">{new Date(log.timestamp).toLocaleString('es-CO')}</p>
                  </div>
                  {log.plate_scanned && <span className="text-[#374151] text-xs font-mono">{log.plate_scanned}</span>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {lightboxOpen && images.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={closeLightbox}>
          <button onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center z-10">
            <X className="w-5 h-5 text-white" />
          </button>

          <button onClick={(e) => { e.stopPropagation(); prevImage(); }}
            className="absolute left-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center z-10">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          <div className="max-w-[90vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <img src={images[lightboxIndex]} alt={`Foto ${lightboxIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg" />
          </div>

          <button onClick={(e) => { e.stopPropagation(); nextImage(); }}
            className="absolute right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center z-10">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>

          <div className="absolute bottom-4 flex items-center gap-4">
            <span className="text-white/70 text-sm">{lightboxIndex + 1} / {images.length}</span>
            <button onClick={(e) => { e.stopPropagation(); handleDeleteImage(lightboxIndex); }}
              className="w-8 h-8 bg-white/10 hover:bg-[#EF4444]/60 rounded-full flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          </div>

          {images.length > 1 && (
            <div className="absolute bottom-16 flex gap-2">
              {images.map((url, i) => (
                <button key={i} onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                  className={`w-12 h-8 rounded overflow-hidden border-2 transition-colors ${i === lightboxIndex ? 'border-white' : 'border-white/30'}`}>
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
