'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { X, Loader2, ChevronRight } from 'lucide-react';
import { BaristaTemplate } from '@/components/templates/barista';
import { PremiumMenuTemplate } from './templates/PremiumMenuTemplate';
import { ClassicMenuTemplate } from './templates/ClassicMenuTemplate';
import { MinimalMenuTemplate } from './templates/MinimalMenuTemplate';
import { getTemplate } from '@/lib/template-router';
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

interface MenuCardProps {
  menu: {
    id: number;
    name: string;
    slug: string;
    description?: string;
    priority?: number;
  };
  shortCode: string;
}

function MenuCard({ menu, shortCode }: MenuCardProps) {
  const router = useRouter();

  const handleSelectMenu = () => {
    // Redirect to the same endpoint with menu_id parameter
    // This will trigger a fetch with that parameter
    router.push(`/m/${shortCode}?menu_id=${menu.id}`);
  };

  return (
    <button
      onClick={handleSelectMenu}
      className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden text-left hover:scale-105 transform"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-neutral-900 group-hover:text-emerald-600 transition-colors">
            {menu.name}
          </h3>
          <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-emerald-600 transition-colors" />
        </div>
        
        {menu.description && (
          <p className="text-neutral-600 text-sm mb-4 line-clamp-2">
            {menu.description}
          </p>
        )}

        {menu.priority !== undefined && (
          <div className="inline-block bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1 rounded-full">
            Priority: {menu.priority}
          </div>
        )}
      </div>
    </button>
  );
}

function PublicMenuContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const shortCode = params.code as string;
  const tableNumber = searchParams?.get('table');
  const menuId = searchParams?.get('menu_id');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuData, setMenuData] = useState<any>(null);

  useEffect(() => {
    loadMenu();
  }, [shortCode, menuId]);

  const loadMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      // Remove trailing /api if present to avoid duplication
      const baseUrl = apiUrl.replace(/\/api\/?$/, '');
      let url = `${baseUrl}/api/public/menu/endpoint/${shortCode}`;
      
      // Add menu_id parameter if provided (used to force selection from corridor)
      if (menuId) {
        url += `?menu_id=${menuId}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        setError(data.message || 'Menu not found');
        return;
      }

      console.log('Menu data received:', data);
      
      // Handle corridor action (multiple menus available)
      if (data.action === 'corridor') {
        console.log('Corridor response detected, rendering menu selector');
        setMenuData(data);
        return;
      }
      
      // Handle redirect action or legacy single menu response
      setMenuData(data.data || data);
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

  // Handle corridor response (multiple menus available)
  if (menuData.action === 'corridor' && menuData.data?.menus) {
    const corridorData = menuData.data;
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center py-8">
            {corridorData.location?.name && (
              <>
                <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2">
                  {corridorData.location.name}
                </h1>
                <p className="text-neutral-600">Please select a menu</p>
              </>
            )}
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {corridorData.menus.map((menu: any) => (
              <MenuCard
                key={menu.id}
                menu={menu}
                shortCode={shortCode}
              />
            ))}
          </div>

          {/* Cache Info */}
          {corridorData.cache_ttl_seconds && (
            <div className="text-center text-sm text-neutral-500 mt-8">
              <p>This page will refresh in {Math.ceil(corridorData.cache_ttl_seconds / 60)} minutes</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Transform API data to template format
  // Handle both franchise and business menus
  const isFranchise = !!menuData.franchise;
  
  // Get template type from various possible sources
  // IMPORTANT: Force business users to NOT use 'barista' template (franchise-only)
  let templateType = isFranchise 
    ? (menuData.franchise?.template_type || 'premium')
    : (menuData.template?.settings?.template_type || menuData.template?.type || 'premium');
  
  // Safety check: If not a franchise but template is 'barista', force to 'classic'
  if (!isFranchise && templateType === 'barista') {
    console.warn('Business menu attempted to use barista template, forcing to classic');
    templateType = 'classic';
  }
  
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
    templateType: templateType,
  } : {
    // For business menus, use business profile data
    id: menuData.business?.id || 0,
    name: menuData.business?.name || menuData.template?.name || 'Menu',
    slug: menuData.business?.slug || 'menu',
    logoUrl: menuData.business?.logo_url || null,
    designTokens: {
      colors: {
        primary: menuData.business?.primary_color || menuData.template?.config?.colors?.primary || '#10b981',
        secondary: menuData.business?.secondary_color || menuData.template?.config?.colors?.secondary || '#3b82f6',
        background: menuData.template?.config?.colors?.background || '#FFF8F0',
        dark: menuData.template?.config?.colors?.dark || '#1A1A1A',
        neutral: menuData.template?.config?.colors?.neutral || '#F5F5F5',
        accent: menuData.business?.primary_color || menuData.template?.config?.colors?.accent || '#10b981',
      },
    },
    templateType: templateType,
  };

  const location: LocationInfo = {
    id: menuData.location?.id || menuData.endpoint?.id || 0,
    name: menuData.location?.name || menuData.business?.branch_name || menuData.endpoint?.name || 'Location',
    slug: menuData.location?.slug || 'location',
    address: menuData.location?.address || (Array.isArray(menuData.business?.address) ? menuData.business.address.join(', ') : '') || '',
    phone: menuData.location?.phone || menuData.business?.phone || '',
    hours: menuData.location?.operating_hours || menuData.business?.operating_hours || {},
  };

  // Extract menu items from categories structure
  const menuItems: MenuItem[] = [];
  
  if (menuData.menu?.categories && Array.isArray(menuData.menu.categories)) {
    // Menu has categories structure
    menuData.menu.categories.forEach((category: any) => {
      if (category.items && Array.isArray(category.items)) {
        category.items.forEach((item: any) => {
          menuItems.push({
            id: item.id?.toString() || Math.random().toString(),
            name: item.name || 'Unnamed Item',
            price: parseFloat(item.price || 0),
            description: item.description || '',
            image: item.image_url || null,
            category: category.name || 'Uncategorized',
            isAvailable: item.is_available !== false,
            customizations: item.customizations || [],
          });
        });
      }
    });
  } else if (menuData.menu_items && Array.isArray(menuData.menu_items)) {
    // Fallback to flat menu_items array
    menuData.menu_items.forEach((item: any) => {
      menuItems.push({
        id: item.id?.toString() || Math.random().toString(),
        name: item.name || 'Unnamed Item',
        price: parseFloat(item.price || 0),
        description: item.description || '',
        image: item.image_url || null,
        category: item.category?.name || 'Uncategorized',
        isAvailable: item.is_available !== false,
        customizations: item.customizations || [],
      });
    });
  }

  // Render appropriate template based on template type
  console.log('Rendering template:', templateType, 'isFranchise:', isFranchise, 'with', menuItems.length, 'items');

  // Franchise templates with custom components
  if (isFranchise && (templateType === 'barista' || templateType === 'isso')) {
    const TemplateComponent = getTemplate(templateType === 'barista' ? 'barista-style' : 'isso-seafood');
    return <TemplateComponent code={shortCode} />;
  }
  
  // All other templates (Classic, Minimal, Premium) use menuData
  // Transform the API response to match the template's expected structure
  const transformedMenuData = {
    endpoint: menuData.endpoint,
    template: menuData.template,
    business: menuData.business,
    categories: menuData.menu?.categories || [],
    offers: menuData.offers || [],
    overrides: menuData.overrides || {},
  };
  
  // These are for BUSINESS users only
  switch (templateType) {
    case 'classic':
      return <ClassicMenuTemplate menuData={transformedMenuData} />;
    
    case 'minimal':
      return <MinimalMenuTemplate menuData={transformedMenuData} />;
    
    case 'premium':
    default:
      return <PremiumMenuTemplate menuData={transformedMenuData} />;
  }
}

export default function PublicMenuPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PublicMenuContent />
    </Suspense>
  );
}
