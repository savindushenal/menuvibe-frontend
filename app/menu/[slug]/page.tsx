'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { extractPublicIdFromSlug, isValidSlug } from '@/lib/slug';

export default function PublicMenuPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const tableNumber = searchParams.get('table');
  
  const [menu, setMenu] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMenu() {
      try {
        setLoading(true);
        setError(null);

        // Check if it's a numeric ID (old URL format) - redirect to slug
        if (/^\d+$/.test(slug)) {
          // Fetch the slug for this numeric ID
          const slugResponse = await fetch(`/api/menus/${slug}/slug`);
          if (slugResponse.ok) {
            const slugData = await slugResponse.json();
            if (slugData.success && slugData.slug) {
              // Redirect to slug-based URL
              const newUrl = tableNumber 
                ? `/menu/${slugData.slug}?table=${tableNumber}`
                : `/menu/${slugData.slug}`;
              window.location.replace(newUrl);
              return;
            }
          }
          // If we can't get the slug, show error
          setError('Menu not found');
          setLoading(false);
          return;
        }

        // Validate slug format
        if (!isValidSlug(slug)) {
          setError('Invalid menu URL');
          setLoading(false);
          return;
        }

        // Build API URL with table parameter if present
        const apiUrl = tableNumber 
          ? `/api/public/menu/${encodeURIComponent(slug)}?table=${encodeURIComponent(tableNumber)}`
          : `/api/public/menu/${encodeURIComponent(slug)}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(data.message || 'Menu not found');
          setLoading(false);
          return;
        }

        setMenu(data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching menu:', err);
        setError('Failed to load menu');
        setLoading(false);
      }
    }

    if (slug) {
      fetchMenu();
    }
  }, [slug, tableNumber]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error || !menu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">🍽️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Menu Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The menu you\'re looking for doesn\'t exist.'}</p>
          <p className="text-sm text-gray-500">Please check the URL or contact the restaurant.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with restaurant branding */}
      <div 
        className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-8"
        style={menu.location?.primary_color ? {
          background: `linear-gradient(135deg, ${menu.location.primary_color} 0%, ${menu.location.secondary_color || menu.location.primary_color} 100%)`
        } : undefined}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            {menu.location?.logo_url && (
              <img 
                src={menu.location.logo_url} 
                alt={menu.location.name}
                className="h-16 w-16 rounded-full bg-white p-1"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold">{menu.location?.name || 'Restaurant'}</h1>
              <p className="text-emerald-100">{menu.name}</p>
              {tableNumber && (
                <p className="text-sm text-emerald-200 mt-1">
                  Table #{tableNumber}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="container mx-auto px-4 py-8">
        {menu.categories && menu.categories.length > 0 ? (
          <div className="space-y-8">
            {menu.categories.map((category: any) => (
              <div key={category.id} className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">
                  {category.name}
                </h2>
                {category.description && (
                  <p className="text-gray-600 mb-4">{category.description}</p>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  {category.items && category.items.map((item: any) => (
                    <div 
                      key={item.id} 
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      style={item.card_color ? { backgroundColor: item.card_color } : undefined}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h3 
                            className="font-semibold text-lg"
                            style={item.heading_color ? { color: item.heading_color } : undefined}
                          >
                            {item.name}
                            {!item.is_available && (
                              <span className="ml-2 text-xs text-red-600">(Unavailable)</span>
                            )}
                          </h3>
                          {item.description && (
                            <p 
                              className="text-sm text-gray-600 mt-1"
                              style={item.text_color ? { color: item.text_color } : undefined}
                            >
                              {item.description}
                            </p>
                          )}
                          {item.allergens && (
                            <p className="text-xs text-gray-500 mt-2">
                              Allergens: {Array.isArray(item.allergens) ? item.allergens.join(', ') : item.allergens}
                            </p>
                          )}
                          {item.dietary_info && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {(Array.isArray(item.dietary_info) ? item.dietary_info : [item.dietary_info]).map((info: string, idx: number) => (
                                <span key={idx} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                  {info}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-emerald-600">
                            {item.currency || '$'}{parseFloat(item.price).toFixed(2)}
                          </p>
                          {item.image_url && (
                            <img 
                              src={item.image_url} 
                              alt={item.name}
                              className="mt-2 w-20 h-20 object-cover rounded"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No items available in this menu.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>Powered by MenuVibe</p>
          {menu.location?.phone && (
            <p className="mt-2">📞 {menu.location.phone}</p>
          )}
          {menu.location?.website && (
            <a 
              href={menu.location.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline mt-1 inline-block"
            >
              Visit Website
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
