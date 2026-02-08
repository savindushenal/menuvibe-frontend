import { useState, useEffect, useCallback } from 'react';

interface QrSessionData {
  sessionToken: string;
  sessionId: number;
  endpoint: {
    id: number;
    name: string;
    type: string;
    identifier: string;
  };
  location: {
    id: number;
    name: string;
  };
  template: {
    id: number;
    name: string;
  };
  scanCount: number;
  isNewSession: boolean;
  hasOrdered: boolean;
  loyaltyLinked: boolean;
  expiresAt: string;
}

interface OrderData {
  id: number;
  orderNumber: string;
  total: number;
  status: string;
  itemsCount: number;
  createdAt: string;
}

interface SessionHistoryChange {
  from: { name: string; type: string } | null;
  to: { name: string; type: string };
  changeType: string;
  movedAt: string;
}

interface SessionSummary {
  sessionToken: string;
  durationMinutes: number;
  scanCount: number;
  orderCount: number;
  totalSpent: number;
  hasOrdered: boolean;
  loyaltyLinked: boolean;
  endpoint: string;
  location: string;
  tableChanges: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.menuvire.com/api';
const SESSION_STORAGE_KEY = 'menuvire_session_token';
const DEVICE_FINGERPRINT_KEY = 'menuvire_device_fingerprint';

export function useQrSession(shortCode?: string) {
  const [session, setSession] = useState<QrSessionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate or retrieve device fingerprint
  const getDeviceFingerprint = useCallback((): string => {
    let fingerprint = localStorage.getItem(DEVICE_FINGERPRINT_KEY);
    
    if (!fingerprint) {
      // Simple fingerprint based on browser characteristics
      const nav = window.navigator;
      const screen = window.screen;
      const guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      
      fingerprint = btoa(
        `${nav.userAgent}-${nav.language}-${screen.width}x${screen.height}-${guid}`
      );
      
      localStorage.setItem(DEVICE_FINGERPRINT_KEY, fingerprint);
    }
    
    return fingerprint;
  }, []);

  // Get stored session token
  const getStoredSessionToken = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(SESSION_STORAGE_KEY);
  }, []);

  // Store session token
  const storeSessionToken = useCallback((token: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SESSION_STORAGE_KEY, token);
  }, []);

  // Initialize or update session
  const initSession = useCallback(async (code: string, loyaltyNumber?: string) => {
    if (!code) return;
    
    setLoading(true);
    setError(null);

    try {
      const existingToken = getStoredSessionToken();
      const deviceFingerprint = getDeviceFingerprint();

      const response = await fetch(`${API_BASE_URL}/public/sessions/${code}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_token: existingToken,
          device_fingerprint: deviceFingerprint,
          loyalty_number: loyaltyNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to initialize session');
      }

      const sessionData: QrSessionData = {
        sessionToken: data.data.session_token,
        sessionId: data.data.session_id,
        endpoint: data.data.endpoint,
        location: data.data.location,
        template: data.data.template,
        scanCount: data.data.scan_count,
        isNewSession: data.data.is_new_session,
        hasOrdered: data.data.has_ordered,
        loyaltyLinked: data.data.loyalty_linked,
        expiresAt: data.data.expires_at,
      };

      setSession(sessionData);
      storeSessionToken(sessionData.sessionToken);

      return sessionData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Session initialization failed:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getStoredSessionToken, getDeviceFingerprint, storeSessionToken]);

  // Link loyalty account to session
  const linkLoyalty = useCallback(async (
    loyaltyNumber: string,
    provider: 'internal' | 'external' = 'internal',
    loyaltyData?: Record<string, any>
  ) => {
    const sessionToken = session?.sessionToken || getStoredSessionToken();
    
    if (!sessionToken) {
      setError('No active session');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/public/sessions/link-loyalty`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_token: sessionToken,
          loyalty_number: loyaltyNumber,
          provider,
          loyalty_data: loyaltyData,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to link loyalty account');
      }

      // Update local session state
      if (session) {
        setSession({ ...session, loyaltyLinked: true });
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Loyalty linking failed:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [session, getStoredSessionToken]);

  // Get order history for this session
  const getOrderHistory = useCallback(async (): Promise<OrderData[] | null> => {
    const sessionToken = session?.sessionToken || getStoredSessionToken();
    
    if (!sessionToken) {
      setError('No active session');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/public/sessions/${sessionToken}/orders`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch order history');
      }

      return data.data.orders;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Failed to fetch order history:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [session, getStoredSessionToken]);

  // Get table movement history
  const getTableHistory = useCallback(async (): Promise<{ changes: SessionHistoryChange[]; summary: SessionSummary } | null> => {
    const sessionToken = session?.sessionToken || getStoredSessionToken();
    
    if (!sessionToken) {
      setError('No active session');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/public/sessions/${sessionToken}/history`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch session history');
      }

      return {
        changes: data.data.changes,
        summary: data.data.summary,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Failed to fetch table history:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [session, getStoredSessionToken]);

  // Clear session (logout)
  const clearSession = useCallback(() => {
    setSession(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }, []);

  // Auto-initialize session on mount if shortCode is provided
  useEffect(() => {
    if (shortCode && !session) {
      initSession(shortCode);
    }
  }, [shortCode, session, initSession]);

  return {
    session,
    loading,
    error,
    initSession,
    linkLoyalty,
    getOrderHistory,
    getTableHistory,
    clearSession,
    deviceFingerprint: getDeviceFingerprint(),
  };
}
