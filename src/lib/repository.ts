import { supabase } from './supabase';
import type { License, LicenseDevice, LicenseWithDeviceData } from './types';

export const licenseRepository = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw error;
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  async getAllLicenses(): Promise<License[]> {
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getAllDevices(): Promise<LicenseWithDeviceData[]> {
    const { data, error } = await supabase
      .from('license_devices')
      .select('*, licenses(license_key, complex_name)')
      .eq('active', true)
      .order('registered_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(d => ({
      ...d,
      license_key: d.licenses?.license_key,
      complex_name: d.licenses?.complex_name,
    }));
  },

  async createLicense(complexName: string, maxDevices: number = 2, trialDays?: number): Promise<License> {
    const licenseKey = generateLicenseKey();
    const trialEndsAt = trialDays
      ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from('licenses')
      .insert({
        license_key: licenseKey,
        complex_name: complexName,
        max_devices: maxDevices,
        active: true,
        trial_ends_at: trialEndsAt,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateLicense(id: string, updates: Partial<Pick<License, 'complex_name' | 'max_devices' | 'active'>>): Promise<License> {
    const { data, error } = await supabase
      .from('licenses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteLicense(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('licenses')
      .delete()
      .eq('id', id);
    return !error;
  },

  async extendLicense(id: string, trialDays: number): Promise<License> {
    const newTrialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('licenses')
      .update({ trial_ends_at: newTrialEndsAt, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async removeDevice(deviceId: string): Promise<boolean> {
    const { error } = await supabase
      .from('license_devices')
      .update({ active: false })
      .eq('id', deviceId);
    return !error;
  },
};

function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return [4, 4, 4]
    .map(len => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join(''))
    .join('-');
}
