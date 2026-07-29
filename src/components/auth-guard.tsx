'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
}

const PUBLIC_PATHS = ['/login', '/activate'];

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check both cookies (server-side enforced) and localStorage (client-side)
    const cookieActive = getCookie('license_active') === 'true';
    const cookieLicenseId = getCookie('license_id');
    const lsActive = localStorage.getItem('license_active') === 'true';
    const lsAdmin = localStorage.getItem('is_admin') === 'true';

    // Sync cookies to localStorage for backward compatibility
    if (cookieActive && !lsActive) {
      localStorage.setItem('license_active', 'true');
    }
    if (cookieLicenseId && !localStorage.getItem('license_id')) {
      localStorage.setItem('license_id', cookieLicenseId);
    }

    const isAuthenticated = cookieActive || lsActive || lsAdmin;

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
