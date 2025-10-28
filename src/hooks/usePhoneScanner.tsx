import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ScannerSession {
  sessionId: string;
  isConnected: boolean;
  status: 'connected' | 'reconnecting' | 'disconnected';
}

interface UseScannerOptions {
  onScan: (barcode: string) => void;
  context: 'sales' | 'inventory';
}

export function usePhoneScanner({ onScan, context }: UseScannerOptions) {
  const [session, setSession] = useState<ScannerSession | null>(null);
  const [lastScanned, setLastScanned] = useState<string>("");

  const generateSession = () => {
    const sessionId = `${context}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setSession({
      sessionId,
      isConnected: false,
      status: 'disconnected'
    });

    return sessionId;
  };

  useEffect(() => {
    if (!session?.sessionId) return;

    let channel: any;
    let reconnectTimer: NodeJS.Timeout;

    const setupChannel = () => {
      channel = supabase
        .channel(`scanner-${session.sessionId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'scanned_barcodes',
            filter: `session_id=eq.${session.sessionId}`
          },
          (payload) => {
            const scannedCode = payload.new.barcode;
            setLastScanned(scannedCode);
            onScan(scannedCode);
            
            setSession(prev => prev ? { ...prev, isConnected: true, status: 'connected' } : null);
            
            // Clean up the record
            supabase
              .from('scanned_barcodes' as any)
              .delete()
              .eq('id', payload.new.id)
              .then();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setSession(prev => prev ? { ...prev, isConnected: true, status: 'connected' } : null);
          } else if (status === 'CHANNEL_ERROR') {
            setSession(prev => prev ? { ...prev, isConnected: false, status: 'reconnecting' } : null);
            
            // Attempt to reconnect
            reconnectTimer = setTimeout(() => {
              channel?.unsubscribe();
              setupChannel();
            }, 3000);
          }
        });
    };

    setupChannel();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [session?.sessionId, onScan]);

  const disconnect = () => {
    setSession(null);
    setLastScanned("");
  };

  return {
    session,
    lastScanned,
    generateSession,
    disconnect
  };
}
