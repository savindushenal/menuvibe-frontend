import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import FranchiseMenuClient from '@/app/[franchise]/menu/[location]/FranchiseMenuClient';

interface PageProps {
  params: Promise<{
    franchise: string;
    location: string;
  }>;
}

// Fetch franchise and location data
async function getFranchiseData(franchiseSlug: string, locationSlug: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  try {
    // Fetch franchise branding
    const franchiseRes = await fetch(`${apiUrl}/api/public/franchise/${franchiseSlug}`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });
    
    if (!franchiseRes.ok) {
      return null;
    }
    
    const franchiseData = await franchiseRes.json();
    
    // Fetch location menu
    const menuRes = await fetch(`${apiUrl}/api/public/franchise/${franchiseSlug}/location/${locationSlug}/menu`, {
      next: { revalidate: 60 },
    });
    
    if (!menuRes.ok) {
      return null;
    }
    
    const menuData = await menuRes.json();
    
    return {
      franchise: franchiseData.data,
      location: menuData.data?.location,
      menuItems: menuData.data?.menu_items || [],
    };
  } catch (error) {
    console.error('Error fetching franchise data:', error);
    return null;
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { franchise: franchiseSlug, location: locationSlug } = await params;
  const data = await getFranchiseData(franchiseSlug, locationSlug);
  
  if (!data) {
    return {
      title: 'Menu Not Found',
    };
  }
  
  return {
    title: `${data.franchise.name} - ${data.location.name} Menu`,
    description: data.franchise.description || `View the menu at ${data.franchise.name} ${data.location.name}`,
    openGraph: {
      title: `${data.franchise.name} - ${data.location.name}`,
      description: data.franchise.description,
      images: data.franchise.logo_url ? [data.franchise.logo_url] : [],
    },
  };
}

export default async function FranchiseMenuPage({ params }: PageProps) {
  const { franchise: franchiseSlug, location: locationSlug } = await params;
  const data = await getFranchiseData(franchiseSlug, locationSlug);
  
  if (!data) {
    notFound();
  }
  
  // Transform data to match component types
  const franchise = {
    id: data.franchise.id,
    name: data.franchise.name,
    slug: data.franchise.slug,
    logoUrl: data.franchise.logo_url,
    designTokens: data.franchise.design_tokens || {
      colors: {
        primary: data.franchise.primary_color || '#F26522',
        secondary: data.franchise.secondary_color || '#E53935',
        background: '#FFF8F0',
        dark: '#1A1A1A',
        neutral: '#F5F5F5',
        accent: data.franchise.accent_color || '#F26522',
      },
    },
    templateType: data.franchise.template_type || 'premium',
  };
  
  const location = {
    id: data.location.id,
    name: data.location.name,
    slug: data.location.slug,
    address: data.location.address,
    phone: data.location.phone,
  };
  
  // Transform menu items
  const menuItems = data.menuItems.map((item: any) => ({
    id: item.id.toString(),
    name: item.name,
    price: parseFloat(item.price),
    description: item.description || '',
    image: item.image_url,
    category: item.category?.name || 'Uncategorized',
    isAvailable: item.is_available,
    customizations: item.customizations || [],
  }));
  
  return (
    <FranchiseMenuClient
      franchise={franchise}
      location={location}
      menuItems={menuItems}
    />
  );
}
