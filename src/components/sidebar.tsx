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
    router.push('/activate');
  };

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#0A0A0A] border-r border-[#374151]">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-[#374151]">
        <Car className="w-6 h-6 text-[#3B82F6]" />
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
                  ? 'bg-[#3B82F6]/20 text-[#93C5FD]'
                  : 'text-[#9CA3AF] hover:bg-[#1A1A1A] hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {link.label}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[#374151]">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-[#EF4444] hover:text-red-300 hover:bg-[#1A1A1A]"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
}
