import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

type Table = 'vehicles' | 'access_logs' | 'visitors' | 'licenses' | 'license_devices';

export function useRealtime(tables: Table[], onDataChanged: () => void) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const callbackRef = useRef(onDataChanged);
  callbackRef.current = onDataChanged;

  useEffect(() => {
    const channel = supabase.channel('db-changes');

    tables.forEach((table) => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          callbackRef.current();
        }
      );
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [tables.join(',')]);
}
