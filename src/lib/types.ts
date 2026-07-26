export interface License {
  id: string;
  license_key: string;
  complex_name: string;
  max_devices: number;
  active: boolean;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LicenseDevice {
  id: string;
  license_id: string;
  device_id: string;
  device_name: string | null;
  active: boolean;
  registered_at: string;
}

export interface LicenseWithDevices extends License {
  devices_count: number;
}

export interface LicenseWithDeviceData extends LicenseDevice {
  license_key?: string;
  complex_name?: string;
}
