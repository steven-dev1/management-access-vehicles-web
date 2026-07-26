'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Car, LayoutDashboard, Shield, Users, LogOut, Settings, Eye } from 'lucide-react';

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

export function MobileHeader() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isAdmin = typeof window !== 'undefined' && localStorage.getItem('is_admin') === 'true';
  const links = isAdmin ? adminLinks : userLinks;

  const handleLogout = () => {
    localStorage.removeItem('license_active');
    localStorage.removeItem('license_id');
    localStorage.removeItem('complex_name');
    localStorage.removeItem('is_admin');
    localStorage.removeItem('device_id');
    router.push('/login');
    setOpen(false);
  };

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger>
          <Button variant="ghost" size="icon" className="text-white">
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="bg-slate-900 border-slate-700 w-64 p-0" showCloseButton={false}>
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-blue-500" />
                <span className="font-bold text-white">Vehicle Access</span>
              </div>
            </div>
            <nav className="flex-1 p-2 space-y-1">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.href}
                    onClick={() => { router.push(link.href); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </button>
                );
              })}
            </nav>
            <div className="p-2 border-t border-slate-700">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-red-400 hover:bg-slate-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-2">
        <Car className="w-5 h-5 text-blue-500" />
        <span className="font-bold text-white">Vehicle Access</span>
      </div>

      <div className="w-10" />
    </div>
  );
}
