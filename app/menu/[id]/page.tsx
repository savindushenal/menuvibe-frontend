'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * Backward compatibility redirect
 * Old URL: /menu/123 → New URL: /menu/{slug}
 */
export default function MenuIdRedirect() {
  const params = useParams();
  const router = useRouter();
  const menuId = params.id as string;

  useEffect(() => {
    async function redirectToSlug() {
      // Only redirect if it's a numeric ID
      if (!/^\d+$/.test(menuId)) {
        router.push('/');
        return;
      }

      try {
        // Fetch menu to get its slug
        const response = await fetch(`/api/menus/${menuId}/slug`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.slug) {
            // Redirect to new slug-based URL
            router.replace(`/menu/${data.slug}`);
            return;
          }
        }
        
        // If menu not found or no slug, show error
        router.push('/');
      } catch (error) {
        console.error('Error redirecting to slug:', error);
        router.push('/');
      }
    }

    redirectToSlug();
  }, [menuId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to menu...</p>
      </div>
    </div>
  );
}
