import { supabase } from './supabase';
import {
  Vehicle,
  VehicleFormData,
  License,
  LicenseDevice,
  AccessLog,
  AccessType,
  Visitor,
  VisitorFormData,
  VisitorStatus,
  DashboardStats,
  TowerStats,
  ApartmentViolation,
  FilterOptions,
  SortOption,
  ParkingAlert,
  OccupancyStats,
} from './types';
import { generateApartmentCode, TOWERS, FLOORS, APARTMENTS_PER_FLOOR } from './constants';

function getCurrentLicenseId(): string | null {
  if (typeof window === 'undefined') return null;
  if (localStorage.getItem('is_admin') === 'true') return null;
  return localStorage.getItem('license_id') || null;
}

function addLicenseFilter(query: any, licenseId?: string | null) {
  const lid = licenseId !== undefined ? licenseId : getCurrentLicenseId();
  if (lid) return query.eq('license_id', lid);
  return query;
}

export async function getDashboardStats(licenseId?: string): Promise<DashboardStats> {

  let query = supabase.from('vehicles').select('vehicle_type');
  query = addLicenseFilter(query, licenseId);
  const { data: vehicles, error } = await query;
  if (error) throw error;

  const total_cars = vehicles?.filter((v: any) => v.vehicle_type === 'car').length || 0;
  const total_motorcycles = vehicles?.filter((v: any) => v.vehicle_type === 'motorcycle').length || 0;

  return {
    total_vehicles: vehicles?.length || 0,
    total_cars,
    total_motorcycles,
  };
}

export async function getTowerStats(licenseId?: string): Promise<TowerStats[]> {

  let query = supabase.from('vehicles').select('tower, vehicle_type');
  query = addLicenseFilter(query, licenseId);
  const { data: vehicles, error } = await query;
  if (error) throw error;

  return TOWERS.map((tower) => {
    const towerVehicles = vehicles?.filter((v: any) => v.tower === tower) || [];
    return {
      tower,
      total_vehicles: towerVehicles.length,
      total_cars: towerVehicles.filter((v: any) => v.vehicle_type === 'car').length,
      total_motorcycles: towerVehicles.filter((v: any) => v.vehicle_type === 'motorcycle').length,
    };
  });
}

export async function getApartmentViolations(licenseId?: string): Promise<ApartmentViolation[]> {

  let query = supabase.from('vehicles').select('tower, floor, apartment, apartment_code, vehicle_type');
  query = addLicenseFilter(query, licenseId);
  const { data: vehicles, error } = await query;
  if (error) throw error;

  const grouped: Record<string, { count: number; cars: number; motorcycles: number; tower: number; floor: number; apartment: number }> = {};
  vehicles?.forEach((v: any) => {
    if (!grouped[v.apartment_code]) {
      grouped[v.apartment_code] = { count: 0, cars: 0, motorcycles: 0, tower: v.tower, floor: v.floor, apartment: v.apartment };
    }
    grouped[v.apartment_code].count++;
    if (v.vehicle_type === 'car') grouped[v.apartment_code].cars++;
    else grouped[v.apartment_code].motorcycles++;
  });

  return Object.entries(grouped)
    .filter(([_, data]) => data.count > 1)
    .map(([code, data]) => ({
      apartment_code: code,
      tower: data.tower,
      floor: data.floor,
      apartment: data.apartment,
      vehicle_count: data.count,
      car_count: data.cars,
      motorcycle_count: data.motorcycles,
    }))
    .sort((a, b) => b.vehicle_count - a.vehicle_count);
}

export async function getParkingAlerts(licenseId?: string): Promise<ParkingAlert[]> {

  let logQuery = supabase
    .from('access_logs')
    .select('vehicle_id, access_type, timestamp, vehicles!inner(id, license_plate, owner_name, tower, apartment_code, vehicle_type)');
  logQuery = addLicenseFilter(logQuery, licenseId);
  const { data: logs, error } = await logQuery.order('timestamp', { ascending: false });
  if (error) throw error;

  const lastEntryByVehicle: Record<string, { entry: string; vehicle: any }> = {};
  logs?.forEach((log: any) => {
    if (log.access_type === 'entry' && !lastEntryByVehicle[log.vehicle_id]) {
      lastEntryByVehicle[log.vehicle_id] = { entry: log.timestamp, vehicle: log.vehicles };
    }
  });

  const now = new Date();
  return Object.entries(lastEntryByVehicle)
    .map(([vehicleId, { entry, vehicle }]) => ({
      vehicle_id: vehicleId,
      license_plate: vehicle.license_plate,
      owner_name: vehicle.owner_name,
      tower: vehicle.tower,
      apartment_code: vehicle.apartment_code,
      vehicle_type: vehicle.vehicle_type,
      last_entry: entry,
      days_parked: Math.floor((now.getTime() - new Date(entry).getTime()) / (1000 * 60 * 60 * 24)),
    }))
    .filter((a) => a.days_parked >= 30)
    .sort((a, b) => b.days_parked - a.days_parked);
}

export async function getOccupancyStats(licenseId?: string): Promise<OccupancyStats[]> {

  const MAX_VEHICLES_PER_APARTMENT = 2;
  const totalApts = FLOORS.length * APARTMENTS_PER_FLOOR.length;
  const maxPerTower = totalApts * MAX_VEHICLES_PER_APARTMENT;

  let query = supabase.from('vehicles').select('tower, vehicle_type');
  query = addLicenseFilter(query, licenseId);
  const { data: vehicles, error } = await query;
  if (error) throw error;

  return TOWERS.map((tower) => {
    const towerVehicles = vehicles?.filter((v: any) => v.tower === tower) || [];
    return {
      tower,
      total_apartments: totalApts,
      occupied_apartments: 0,
      total_vehicles: towerVehicles.length,
      max_vehicles: maxPerTower,
      car_count: towerVehicles.filter((v: any) => v.vehicle_type === 'car').length,
      motorcycle_count: towerVehicles.filter((v: any) => v.vehicle_type === 'motorcycle').length,
      occupancy_rate: Math.round((towerVehicles.length / maxPerTower) * 100),
    };
  });
}

export async function getVehicles(filters?: FilterOptions, sort?: SortOption, licenseId?: string): Promise<Vehicle[]> {

  let query = supabase.from('vehicles').select('*');
  query = addLicenseFilter(query, licenseId);

  if (filters?.tower) query = query.eq('tower', filters.tower);
  if (filters?.apartment) query = query.eq('apartment', parseInt(filters.apartment));
  if (filters?.vehicle_type) query = query.eq('vehicle_type', filters.vehicle_type);
  if (filters?.search) {
    query = query.or(`license_plate.ilike.%${filters.search}%,owner_name.ilike.%${filters.search}%,apartment_code.ilike.%${filters.search}%`);
  }

  switch (sort) {
    case 'oldest': query = query.order('created_at', { ascending: true }); break;
    case 'plate_asc': query = query.order('license_plate', { ascending: true }); break;
    case 'plate_desc': query = query.order('license_plate', { ascending: false }); break;
    case 'tower_asc': query = query.order('tower', { ascending: true }).order('apartment', { ascending: true }); break;
    case 'tower_desc': query = query.order('tower', { ascending: false }).order('apartment', { ascending: false }); break;
    default: query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createVehicle(vehicleData: VehicleFormData, licenseId?: string): Promise<Vehicle> {

  const lid = licenseId || getCurrentLicenseId();
  const apartment_code = generateApartmentCode(vehicleData.floor, vehicleData.apartment);

  const insertData: any = {
    license_plate: vehicleData.license_plate.toUpperCase(),
    vehicle_type: vehicleData.vehicle_type,
    tower: vehicleData.tower,
    floor: vehicleData.floor,
    apartment: vehicleData.apartment,
    apartment_code,
    owner_name: vehicleData.owner_name,
    is_restricted: vehicleData.is_restricted,
    restriction_reason: vehicleData.restriction_reason || null,
  };
  if (lid) insertData.license_id = lid;

  const { data, error } = await supabase
    .from('vehicles')
    .insert([insertData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getVehicleById(id: string): Promise<Vehicle | null> {

  const lid = getCurrentLicenseId();
  let query = supabase.from('vehicles').select('*').eq('id', id);
  if (lid) query = query.eq('license_id', lid);
  const { data, error } = await query.single();
  if (error) throw error;
  return data;
}

export async function updateVehicle(id: string, vehicleData: Partial<VehicleFormData>): Promise<Vehicle> {

  const lid = getCurrentLicenseId();
  const updateData: any = { ...vehicleData, updated_at: new Date().toISOString() };
  if (vehicleData.floor && vehicleData.apartment) {
    updateData.apartment_code = generateApartmentCode(vehicleData.floor, vehicleData.apartment);
  }
  if (vehicleData.license_plate) updateData.license_plate = vehicleData.license_plate.toUpperCase();

  let query = supabase.from('vehicles').update(updateData).eq('id', id);
  if (lid) query = query.eq('license_id', lid);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}

export async function deleteVehicle(id: string): Promise<void> {

  const lid = getCurrentLicenseId();
  let query = supabase.from('vehicles').delete().eq('id', id);
  if (lid) query = query.eq('license_id', lid);
  const { error } = await query;
  if (error) throw error;
}

const VEHICLE_IMAGES_BUCKET = 'vehicle-images';
const MAX_VEHICLE_IMAGES = 3;

export async function uploadVehicleImage(vehicleId: string, file: File): Promise<string> {
  const fileName = `${vehicleId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from(VEHICLE_IMAGES_BUCKET)
    .upload(fileName, file, { contentType: file.type || 'image/jpeg' });
  if (error) throw error;
  const { data } = supabase.storage.from(VEHICLE_IMAGES_BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

export async function deleteVehicleImage(imageUrl: string): Promise<void> {
  const url = new URL(imageUrl);
  const pathParts = url.pathname.split('/');
  const bucketIndex = pathParts.indexOf(VEHICLE_IMAGES_BUCKET);
  if (bucketIndex === -1) return;
  const filePath = pathParts.slice(bucketIndex + 1).join('/');
  const { error } = await supabase.storage.from(VEHICLE_IMAGES_BUCKET).remove([filePath]);
  if (error) throw error;
}

export async function updateVehicleImages(vehicleId: string, images: string[]): Promise<void> {
  const { error } = await supabase
    .from('vehicles')
    .update({ images, updated_at: new Date().toISOString() })
    .eq('id', vehicleId);
  if (error) throw error;
}

export async function searchVehicleByPlate(plate: string, licenseId?: string): Promise<Vehicle | null> {

  const normalized = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');

  let query = supabase
    .from('vehicles')
    .select('*')
    .ilike('license_plate', plate.toUpperCase());
  query = addLicenseFilter(query, licenseId);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (data) return data;

  let fallback = supabase
    .from('vehicles')
    .select('*');
  fallback = addLicenseFilter(fallback, licenseId);
  const { data: all, error: fbErr } = await fallback;
  if (fbErr) throw fbErr;

  return all?.find(v => v.license_plate.toUpperCase().replace(/[^A-Z0-9]/g, '') === normalized) || null;
}

export async function searchVehicles(query: string, licenseId?: string): Promise<Vehicle[]> {
  const clean = query.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length < 1) return [];

  let q = addLicenseFilter(supabase.from('vehicles').select('*'), licenseId);
  q = q.or(`license_plate.ilike.%${query}%,owner_name.ilike.%${query}%`).order('license_plate').limit(15);
  const { data, error } = await q;
  if (error) throw error;
  if (data && data.length > 0) return data;

  let fb = addLicenseFilter(supabase.from('vehicles').select('*'), licenseId);
  const { data: all, error: fbErr } = await fb;
  if (fbErr) throw fbErr;

  return all?.filter((v: any) => {
    const normalized = v.license_plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return normalized.includes(clean) || v.owner_name.toUpperCase().includes(clean);
  }).slice(0, 15) || [];
}

export async function registerAccess(vehicleId: string, accessType: AccessType, plateScanned?: string, licenseId?: string): Promise<AccessLog> {

  const lid = licenseId || getCurrentLicenseId();

  const insertData: any = {
    vehicle_id: vehicleId,
    access_type: accessType,
    plate_scanned: plateScanned || null,
    timestamp: new Date().toISOString(),
  };
  if (lid) insertData.license_id = lid;

  const { data, error } = await supabase
    .from('access_logs')
    .insert([insertData])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getAccessHistory(limit?: number, licenseId?: string): Promise<AccessLog[]> {

  let query = supabase
    .from('access_logs')
    .select('*, vehicles(*)')
    .order('timestamp', { ascending: false });
  query = addLicenseFilter(query, licenseId);
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getTodayAccessLogs(licenseId?: string): Promise<AccessLog[]> {

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

  let query = supabase
    .from('access_logs')
    .select('*, vehicles(*)')
    .gte('timestamp', startOfDay)
    .lt('timestamp', endOfDay)
    .order('timestamp', { ascending: false });
  query = addLicenseFilter(query, licenseId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getVisitors(status?: VisitorStatus, licenseId?: string): Promise<Visitor[]> {

  let query = supabase.from('visitors').select('*').order('created_at', { ascending: false });
  query = addLicenseFilter(query, licenseId);
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createVisitor(visitorData: VisitorFormData, licenseId?: string): Promise<Visitor> {

  const lid = licenseId || getCurrentLicenseId();

  const insertData: any = {
    visitor_plate: visitorData.visitor_plate.toUpperCase(),
    visitor_name: visitorData.visitor_name,
    host_tower: visitorData.host_tower,
    host_apartment_code: generateApartmentCode(visitorData.host_tower, parseInt(visitorData.host_apartment_code)),
    host_owner_name: visitorData.host_owner_name,
    purpose: visitorData.purpose || null,
    expected_duration_hours: visitorData.expected_duration_hours,
    status: 'expected' as VisitorStatus,
  };
  if (lid) insertData.license_id = lid;

  const { data, error } = await supabase
    .from('visitors')
    .insert([insertData])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function checkInVisitor(id: string): Promise<Visitor> {

  const lid = getCurrentLicenseId();
  let query = supabase
    .from('visitors')
    .update({ status: 'active', entry_time: new Date().toISOString() })
    .eq('id', id);
  if (lid) query = query.eq('license_id', lid);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}

export async function checkOutVisitor(id: string): Promise<Visitor> {

  const lid = getCurrentLicenseId();
  let query = supabase
    .from('visitors')
    .update({ status: 'completed', exit_time: new Date().toISOString() })
    .eq('id', id);
  if (lid) query = query.eq('license_id', lid);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}

export async function deleteVisitor(id: string): Promise<void> {

  const lid = getCurrentLicenseId();
  let query = supabase.from('visitors').delete().eq('id', id);
  if (lid) query = query.eq('license_id', lid);
  const { error } = await query;
  if (error) throw error;
}

export async function getLicenses(): Promise<License[]> {

  const { data, error } = await supabase.from('licenses').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getLicenseDevices(licenseId: string): Promise<LicenseDevice[]> {

  const { data, error } = await supabase.from('license_devices').select('*').eq('license_id', licenseId).order('registered_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getAllDevices(): Promise<LicenseDevice[]> {

  const { data, error } = await supabase.from('license_devices').select('*').order('registered_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function activateLicense(licenseKey: string, deviceId: string, deviceName?: string): Promise<{ license: License; device: LicenseDevice }> {

  const { data: license, error: licenseError } = await supabase
    .from('licenses')
    .select('*')
    .eq('license_key', licenseKey.toUpperCase())
    .eq('active', true)
    .single();
  if (licenseError || !license) throw new Error('Licencia no encontrada o inactiva');

  if (license.trial_ends_at && new Date(license.trial_ends_at) < new Date()) {
    throw new Error('Licencia expirada');
  }

  const { count } = await supabase
    .from('license_devices')
    .select('*', { count: 'exact', head: true })
    .eq('license_id', license.id)
    .eq('active', true);

  const { data: existingDevice } = await supabase
    .from('license_devices')
    .select('*')
    .eq('license_id', license.id)
    .eq('device_id', deviceId)
    .single();

  if (existingDevice) {
    if (!existingDevice.active) {
      await supabase.from('license_devices').update({ active: true, device_name: deviceName }).eq('id', existingDevice.id);
    }
    return { license, device: existingDevice };
  }

  if ((count || 0) >= license.max_devices) {
    throw new Error(`Máximo de ${license.max_devices} dispositivos alcanzado`);
  }

  const { data: device, error: deviceError } = await supabase
    .from('license_devices')
    .insert([{
      license_id: license.id,
      device_id: deviceId,
      device_name: deviceName || `Dispositivo ${(count || 0) + 1}`,
      active: true,
    }])
    .select()
    .single();
  if (deviceError) throw deviceError;

  return { license, device };
}

export async function extendLicense(licenseId: string, days: number = 30): Promise<License> {

  const { data: current, error: fetchError } = await supabase.from('licenses').select('*').eq('id', licenseId).single();
  if (fetchError) throw fetchError;

  const baseDate = current.trial_ends_at && new Date(current.trial_ends_at) > new Date()
    ? new Date(current.trial_ends_at)
    : new Date();
  const newEnd = new Date(baseDate);
  newEnd.setDate(newEnd.getDate() + days);

  const { data, error } = await supabase
    .from('licenses')
    .update({ trial_ends_at: newEnd.toISOString(), active: true, updated_at: new Date().toISOString() })
    .eq('id', licenseId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createLicense(complexName: string, maxDevices: number = 3, trialDays?: number): Promise<License> {

  const key = `LIC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const trialEndsAt = trialDays ? new Date(Date.now() + trialDays * 86400000).toISOString() : null;

  const { data, error } = await supabase
    .from('licenses')
    .insert([{ license_key: key, complex_name: complexName, max_devices: maxDevices, active: true, trial_ends_at: trialEndsAt }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function toggleLicenseDevice(deviceId: string, active: boolean): Promise<void> {

  const { error } = await supabase.from('license_devices').update({ active }).eq('id', deviceId);
  if (error) throw error;
}

export async function deleteLicense(licenseId: string): Promise<void> {

  await supabase.from('license_devices').delete().eq('license_id', licenseId);
  const { error } = await supabase.from('licenses').delete().eq('id', licenseId);
  if (error) throw error;
}

export async function updateLicense(licenseId: string, updates: { complex_name?: string; max_devices?: number; active?: boolean; trial_ends_at?: string | null }): Promise<License> {
  const { data, error } = await supabase
    .from('licenses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', licenseId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setPermanent(licenseId: string): Promise<License> {
  const { data, error } = await supabase
    .from('licenses')
    .update({ trial_ends_at: null, updated_at: new Date().toISOString() })
    .eq('id', licenseId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function isDeviceAuthorized(deviceId: string): Promise<boolean> {

  const { data, error } = await supabase
    .from('license_devices')
    .select('id')
    .eq('device_id', deviceId)
    .eq('active', true)
    .limit(1);
  if (error) throw error;
  return (data?.length || 0) > 0;
}

export async function getComplexNameForDevice(deviceId: string): Promise<string | null> {

  const { data, error } = await supabase
    .from('license_devices')
    .select('licenses(complex_name)')
    .eq('device_id', deviceId)
    .eq('active', true)
    .single();
  if (error || !data) return null;
  return (data as any).licenses?.complex_name || null;
}
