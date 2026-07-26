'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Car, LayoutDashboard, Shield, Users, LogOut, Settings, Eye } from 'lucide-react';

const adminLinks = [
  { href: '/', label: 'Panel', icon: LayoutDashboard },
  { href: '/licenses', label: 'Licencias', icon: Shield },
  { href: '/devices', label: 'Dispositivos', icon: Settings },
];

const userLinks = [
  { href: '/', label: 'Panel', icon: LayoutDashboard },
  { href: '/vehicles', label: 'Vehículos', icon: Car },
  { href: '/access', label: 'Acceso', icon: Eye },
  { href: '/visitors', label: 'Visitantes', icon: Users },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = typeof window !== 'undefined' && localStorage.getItem('is_admin') === 'true';
  const links = isAdmin ? adminLinks : userLinks;

  const handleLogout = () => {
    localStorage.removeItem('license_active');
    localStorage.removeItem('license_id');
    localStorage.removeItem('complex_name');
    localStorage.removeItem('is_admin');
    localStorage.removeItem('device_id');
    router.push('/login');
  };

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-slate-900 border-r border-slate-700">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-700">
        <Car className="w-6 h-6 text-blue-500" />
        <span className="font-bold text-white text-lg">Vehicle Access</span>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <button
              key={link.href}
              onClick={() => router.push(link.href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {link.label}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-700">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-slate-800"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}
