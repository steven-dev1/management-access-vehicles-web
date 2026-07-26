'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
}

const PUBLIC_PATHS = ['/login', '/activate'];

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const licenseActive = localStorage.getItem('license_active') === 'true';
    const isAdmin = localStorage.getItem('is_admin') === 'true';
    const isAuthenticated = licenseActive || isAdmin;

    if (PUBLIC_PATHS.includes(pathname)) {
      if (isAuthenticated) {
        router.replace('/');
      } else {
        setChecking(false);
      }
      return;
    }

    if (!isAuthenticated) {
      router.replace('/activate');
      return;
    }

    setChecking(false);
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
