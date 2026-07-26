'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Key, Smartphone, LogOut, Car } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Panel', icon: LayoutDashboard },
  { href: '/licenses', label: 'Licencias', icon: Key },
  { href: '/devices', label: 'Dispositivos', icon: Smartphone },
];

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card lg:block">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Car className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold">Vehicle Access</h1>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </aside>
  );
}
