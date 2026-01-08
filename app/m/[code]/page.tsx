'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { X, Loader2 } from 'lucide-react';
import { BaristaTemplate } from '@/components/templates/barista';
import { PremiumTemplate } from '@/components/templates/premium';
import { ClassicTemplate } from '@/components/templates/classic';
import { MinimalTemplate } from '@/components/templates/minimal';
import type { FranchiseInfo, LocationInfo, MenuItem } from '@/components/templates/premium/types';

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
  const searchParams = useSearchParams();
  const shortCode = params.code as string;
  const tableNumber = searchParams?.get('table');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuData, setMenuData] = useState<any>(null);

  useEffect(() => {
    loadMenu();
  }, [shortCode]);

  const loadMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      // Remove trailing /api if present to avoid duplication
      const baseUrl = apiUrl.replace(/\/api\/?$/, '');
      const response = await fetch(`${baseUrl}/api/public/menu/endpoint/${shortCode}`);
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        setError(data.message || 'Menu not found');
        return;
      }

      setMenuData(data.data);
    } catch (err: any) {
      console.error('Failed to load menu:', err);
      setError(err.message || 'Failed to load menu');
    } finally {
      setLoading(false);
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

  // Transform API data to template format
  // Handle both franchise and business menus
  const isFranchise = !!menuData.franchise;
  
  const franchise: FranchiseInfo = isFranchise ? {
    id: menuData.franchise.id,
    name: menuData.franchise.name,
    slug: menuData.franchise.slug,
    logoUrl: menuData.franchise.logo_url,
    designTokens: menuData.franchise.design_tokens || {
      colors: {
        primary: '#F26522',
        secondary: '#E53935',
        background: '#FFF8F0',
        dark: '#1A1A1A',
        neutral: '#F5F5F5',
        accent: '#F26522',
      },
    },
    templateType: menuData.franchise.template_type || 'premium',
  } : {
    // For business menus, use business profile data
    id: menuData.business?.id || 0,
    name: menuData.business?.name || menuData.template?.name || 'Menu',
    slug: menuData.business?.slug || 'menu',
    logoUrl: menuData.business?.logo_url || null,
    designTokens: {
      colors: {
        primary: menuData.business?.primary_color || '#10b981',
        secondary: menuData.business?.secondary_color || '#3b82f6',
        background: '#FFF8F0',
        dark: '#1A1A1A',
        neutral: '#F5F5F5',
        accent: menuData.business?.primary_color || '#10b981',
      },
    },
    templateType: menuData.template?.type || 'premium',
  };

  const location: LocationInfo = {
    id: menuData.location?.id || menuData.endpoint?.id || 0,
    name: menuData.location?.name || menuData.business?.branch_name || menuData.endpoint?.name || 'Location',
    slug: menuData.location?.slug || 'location',
    address: menuData.location?.address || menuData.business?.address?.join(', ') || '',
    phone: menuData.location?.phone || menuData.business?.phone || '',
    hours: menuData.location?.operating_hours || menuData.business?.operating_hours || {},
  };

  const menuItems: MenuItem[] = (menuData.menu_items || menuData.menu?.categories?.flatMap((cat: any) => cat.items || []) || []).map((item: any) => ({
    id: item.id?.toString() || Math.random().toString(),
    name: item.name || 'Unnamed Item',
    price: parseFloat(item.price || 0),
    description: item.description || '',
    image: item.image_url || null,
    category: item.category?.name || 'Uncategorized',
    isAvailable: item.is_available !== false,
    customizations: item.customizations || [],
  }));

  // Render appropriate template based on franchise template_type
  const templateType = franchise.templateType || 'premium';

  switch (templateType) {
    case 'barista':
      return (
        <BaristaTemplate
          franchise={franchise}
          location={location}
          menuItems={menuItems}
          tableNumber={tableNumber || menuData.endpoint?.identifier}
        />
      );
    
    case 'classic':
      return (
        <ClassicTemplate
          franchise={franchise}
          location={location}
          menuItems={menuItems}
        />
      );
    
    case 'minimal':
      return (
        <MinimalTemplate
          franchise={franchise}
          location={location}
          menuItems={menuItems}
        />
      );
    
    default:
      return (
        <PremiumTemplate
          franchise={franchise}
          location={location}
          menuItems={menuItems}
        />
      );
  }
}

export default function PublicMenuPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PublicMenuContent />
    </Suspense>
  );
}
