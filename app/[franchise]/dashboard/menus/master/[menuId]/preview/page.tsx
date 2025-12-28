'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, ChefHat } from 'lucide-react';
import FranchiseMenuClient from '@/app/[franchise]/menu/[location]/FranchiseMenuClient';

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  category_id: number;
}

interface MenuCategory {
  id: number;
  name: string;
  description: string | null;
  sort_order: number;
  items: MenuItem[];
}

interface MasterMenu {
  id: number;
  name: string;
  description: string | null;
  currency: string;
  image_url: string | null;
  categories: MenuCategory[];
}

interface FranchiseData {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  template_type: string;
  design_tokens: any;
}

export default function MasterMenuPreviewPage() {
  const params = useParams();
  const franchiseSlug = params?.franchise as string;
  const menuId = params?.menuId as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<MasterMenu | null>(null);
  const [franchise, setFranchise] = useState<FranchiseData | null>(null);

  useEffect(() => {
    fetchMenuData();
  }, [franchiseSlug, menuId]);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      // First get franchise data
      const franchiseRes = await api.get(`/franchise/${franchiseSlug}/dashboard`);
      if (!franchiseRes.data.success) {
        throw new Error('Franchise not found');
      }
      
      const franchiseData = franchiseRes.data.data.franchise;
      setFranchise(franchiseData);
      const franchiseId = franchiseData.id;
      
      // Get full menu with categories and items
      const menuRes = await api.get(`/franchises/${franchiseId}/master-menus/${menuId}`);
      if (menuRes.data.success) {
        setMenu(menuRes.data.data);
      } else {
        throw new Error('Menu not found');
      }
    } catch (err: any) {
      console.error('Failed to load menu:', err);
      setError(err.message || 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading menu preview...</p>
        </div>
      </div>
    );
  }

  if (error || !menu || !franchise) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white">
        <div className="text-center">
          <ChefHat className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Menu Not Found</h2>
          <p className="text-gray-600">{error || 'The requested menu could not be loaded.'}</p>
        </div>
      </div>
    );
  }

  // Transform data to match FranchiseMenuClient format
  const franchiseInfo = {
    id: franchise.id,
    name: franchise.name,
    slug: franchise.slug,
    logoUrl: franchise.logo_url,
    designTokens: franchise.design_tokens || {
      colors: {
        primary: '#F26522',
        secondary: '#E53935',
        background: '#FFF8F0',
        dark: '#1A1A1A',
        neutral: '#F5F5F5',
        accent: '#F26522',
      },
    },
    templateType: franchise.template_type || 'premium',
  };

  const locationInfo = {
    id: 0,
    name: 'Master Menu Preview',
    slug: 'preview',
    address: '',
    phone: '',
  };

  // Flatten all items from all categories
  const menuItems = menu.categories.flatMap(category => 
    category.items.map(item => ({
      id: item.id.toString(),
      name: item.name,
      price: parseFloat(item.price.toString()),
      description: item.description || '',
      image: item.image_url,
      category: category.name,
      isAvailable: item.is_available,
      customizations: [],
    }))
  );

  return (
    <div className="relative">
      {/* Preview Banner */}
      <div className="sticky top-0 z-50 bg-amber-600 text-white text-center py-2 text-sm font-medium shadow-md">
        🔍 Preview Mode - This is how your menu will appear to customers
      </div>

      {/* Use the same template system as public menus */}
      <FranchiseMenuClient
        franchise={franchiseInfo}
        location={locationInfo}
        menuItems={menuItems}
      />
    </div>
  );
}
