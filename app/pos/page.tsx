'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChefHat, MapPin, LogOut, Loader2, RefreshCw } from 'lucide-react';

const API = 'https://api.menuvire.com/api';

interface Location {
  id: number;
  name: string;
  franchise_id: number;
  address: string | null;
}

export default function PosIndexPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = sessionStorage.getItem('pos_token');
    const u = sessionStorage.getItem('pos_user');
    if (!t) {
      router.replace('/pos/login');
      return;
    }
    setToken(t);
    if (u) {
      try { setUser(JSON.parse(u)); } catch {}
    }
  }, [router]);

  useEffect(() => {
    if (!token) return;
    fetchLocations(token);
  }, [token]);

  const fetchLocations = async (t: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/pos/me/locations`, {
        headers: { Authorization: `Bearer ${t}`, Accept: 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 401) {
          handleLogout();
          return;
        }
        setError(data.message || 'Could not load locations.');
        setLoading(false);
        return;
      }
      const locs: Location[] = data.data || [];
      if (locs.length === 1) {
        // Only one branch — go straight in
        router.replace(`/pos/${locs[0].id}`);
        return;
      }
      setLocations(locs);
    } catch {
      setError('Connection error. Check your internet.');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('pos_token');
    sessionStorage.removeItem('pos_user');
    router.replace('/pos/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#F26522] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col">
      {/* Top bar */}
      <header className="bg-[#1A1A1A] border-b border-white/10 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#F26522] rounded-lg flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-none">MenuVibe POS</p>
              {user?.name && (
                <p className="text-xs text-gray-400 mt-0.5">{user.name}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <h2 className="text-xl font-bold text-white mb-1">Select a branch</h2>
          <p className="text-gray-500 text-sm mb-6">Choose the location you&apos;re working at today.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800/40 rounded-xl flex items-center gap-3">
              <p className="text-red-400 text-sm flex-1">{error}</p>
              <button onClick={() => token && fetchLocations(token)}>
                <RefreshCw className="w-4 h-4 text-red-400" />
              </button>
            </div>
          )}

          {locations.length === 0 && !error && (
            <div className="text-center py-12 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No branches assigned to your account.</p>
              <p className="text-xs mt-1 text-gray-600">Ask your franchise owner to add you to a branch.</p>
            </div>
          )}

          <div className="space-y-3">
            {locations.map(loc => (
              <button
                key={loc.id}
                onClick={() => router.push(`/pos/${loc.id}`)}
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-2xl px-5 py-4
                           flex items-center gap-4 text-left hover:border-[#F26522]/60
                           hover:bg-[#F26522]/5 active:scale-[0.98] transition-all group"
              >
                <div className="w-10 h-10 bg-[#F26522]/15 rounded-xl flex items-center justify-center shrink-0
                                group-hover:bg-[#F26522]/25 transition-colors">
                  <MapPin className="w-5 h-5 text-[#F26522]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm leading-tight">{loc.name}</p>
                  {loc.address && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{loc.address}</p>
                  )}
                </div>
                <span className="text-[#F26522] text-lg font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  →
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
