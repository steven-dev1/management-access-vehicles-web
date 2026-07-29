export function maskLicenseKey(key: string): string {
  if (!key || key.length < 10) return key;
  const parts = key.split('-');
  if (parts.length >= 3) {
    return parts[0] + '-' + '*'.repeat(parts[1].length) + '-' + '*'.repeat(parts[2].length);
  }
  return key.slice(0, 4) + '-****-****';
}

export function maskDeviceId(id: string): string {
  if (!id || id.length < 8) return id;
  return id.slice(0, 6) + '...' + id.slice(-4);
}
