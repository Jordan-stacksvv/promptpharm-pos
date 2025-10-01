import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface PendingOperation {
  id: string;
  type: 'insert' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // Load pending operations from localStorage
    const stored = localStorage.getItem('pending_operations');
    if (stored) {
      setPendingOperations(JSON.parse(stored));
    }

    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online! Syncing data...');
      syncPendingOperations();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are offline. Changes will sync when online.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const savePendingOperation = (operation: Omit<PendingOperation, 'id' | 'timestamp'>) => {
    const newOp: PendingOperation = {
      ...operation,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };

    const updated = [...pendingOperations, newOp];
    setPendingOperations(updated);
    localStorage.setItem('pending_operations', JSON.stringify(updated));
  };

  const syncPendingOperations = async () => {
    if (pendingOperations.length === 0 || syncing) return;

    setSyncing(true);
    const successful: string[] = [];

    for (const op of pendingOperations) {
      try {
        if (op.type === 'insert') {
          const { error } = await supabase.from(op.table).insert(op.data);
          if (error) throw error;
        } else if (op.type === 'update') {
          const { error } = await supabase.from(op.table).update(op.data).eq('id', op.data.id);
          if (error) throw error;
        } else if (op.type === 'delete') {
          const { error } = await supabase.from(op.table).delete().eq('id', op.data.id);
          if (error) throw error;
        }
        successful.push(op.id);
      } catch (error) {
        console.error('Sync error for operation:', op, error);
      }
    }

    // Remove successful operations
    const remaining = pendingOperations.filter(op => !successful.includes(op.id));
    setPendingOperations(remaining);
    localStorage.setItem('pending_operations', JSON.stringify(remaining));

    setSyncing(false);
    
    if (successful.length > 0) {
      toast.success(`Synced ${successful.length} operations successfully!`);
    }
  };

  const executeOperation = async (
    type: 'insert' | 'update' | 'delete',
    table: string,
    data: any
  ) => {
    if (isOnline) {
      try {
        if (type === 'insert') {
          return await supabase.from(table).insert(data).select();
        } else if (type === 'update') {
          return await supabase.from(table).update(data).eq('id', data.id).select();
        } else if (type === 'delete') {
          return await supabase.from(table).delete().eq('id', data.id);
        }
      } catch (error) {
        console.error('Operation error:', error);
        throw error;
      }
    } else {
      // Save for later sync
      savePendingOperation({ type, table, data });
      toast.info('Saved offline. Will sync when online.');
      return { data: [data], error: null };
    }
  };

  return {
    isOnline,
    syncing,
    pendingCount: pendingOperations.length,
    executeOperation,
    syncNow: syncPendingOperations,
  };
}
