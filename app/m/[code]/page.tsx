'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { X, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { TemplateRenderer, PublicMenuData } from './templates';

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
        <p className="mt-2 text-gray-600">Loading menu...</p>
      </div>
    </div>
  );
}

function PublicMenuContent() {
  const params = useParams();
  const shortCode = params.code as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuData, setMenuData] = useState<PublicMenuData | null>(null);

  useEffect(() => {
    loadMenu();
    recordScan();
  }, [shortCode]);

  const loadMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getPublicMenu(shortCode);
      if (response.success && response.data) {
        // Map API response to expected format
        const apiData = response.data;
        const mappedData: PublicMenuData = {
          endpoint: apiData.endpoint,
          template: apiData.template,
          categories: apiData.menu?.categories || [],
          offers: apiData.offers || [],
          overrides: apiData.menu?.overrides || {},
        };
        setMenuData(mappedData);
      } else {
        setError('Menu not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const recordScan = async () => {
    try {
      await apiClient.recordMenuScan(shortCode);
    } catch {
      // Silent fail for analytics
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error || !menuData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900 mb-2">Menu Not Found</h1>
          <p className="text-neutral-600">
            {error || 'This menu link may be expired or invalid.'}
          </p>
        </div>
      </div>
    );
  }

  // Render using the template system
  return <TemplateRenderer menuData={menuData} />;
}

export default function PublicMenuPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PublicMenuContent />
    </Suspense>
  );
}
