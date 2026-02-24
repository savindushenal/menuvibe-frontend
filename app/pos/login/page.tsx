'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ChefHat, Eye, EyeOff, Loader2 } from 'lucide-react';

const API = 'https://api.menuvire.com/api';

export default function PosLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        setError(data.message || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      // Store in sessionStorage — cleared when browser tab is closed
      sessionStorage.setItem('pos_token', data.token);
      sessionStorage.setItem('pos_user', JSON.stringify({
        id: data.user?.id,
        name: data.user?.name,
        email: data.user?.email,
      }));

      router.push('/pos');
    } catch {
      setError('Connection error. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-[#F26522] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#F26522]/30">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">MenuVibe POS</h1>
          <p className="text-gray-500 text-sm mt-1">Staff sign in</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#1A1A1A] rounded-2xl p-6 border border-white/10 space-y-4"
        >
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 text-white
                         placeholder-gray-600 text-sm focus:outline-none focus:border-[#F26522]
                         transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#252525] border border-white/10 rounded-xl px-4 py-3 pr-11 text-white
                           placeholder-gray-600 text-sm focus:outline-none focus:border-[#F26522]
                           transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-xl px-4 py-2">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white bg-[#F26522]
                       hover:bg-[#e05510] active:scale-95 transition-all
                       disabled:opacity-60 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600 mt-6">
          MenuVibe POS · Staff access only
        </p>
      </div>
    </div>
  );
}
