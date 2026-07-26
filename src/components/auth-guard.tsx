'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !session && pathname !== '/login') {
      router.push('/login');
    }
  }, [session, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session && pathname !== '/login') return null;

  return <>{children}</>;
}
