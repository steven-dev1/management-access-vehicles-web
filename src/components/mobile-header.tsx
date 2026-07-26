'use client';

import { useAuth } from '@/lib/auth-context';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Key, Smartphone, LogOut, Car, Menu } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Panel', icon: LayoutDashboard },
  { href: '/licenses', label: 'Licencias', icon: Key },
  { href: '/devices', label: 'Dispositivos', icon: Smartphone },
];

export function MobileHeader() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="flex items-center justify-between border-b bg-card px-4 py-3 lg:hidden">
      <div className="flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
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
                      onClick={() => setOpen(false)}
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
                <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <Car className="h-5 w-5 text-primary" />
          <span className="font-bold">Vehicle Access</span>
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={() => signOut()}>
        <LogOut className="h-4 w-4 text-muted-foreground" />
      </Button>
    </header>
  );
}
