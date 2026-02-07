'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * API-Driven Menu Configuration Types
 */
interface MenuConfig {
  version: string;
  layout: string;
  colorTheme: string;
  design: {
    colors: {
      primary: string;
      secondary: string;
      background: string;
      text: string;
      accent: string;
    };
    typography: {
      fontFamily: string;
      headingWeight: number;
      bodyWeight: number;
    };
    spacing: {
      container: string;
      section: string;
      card: string;
    };
    borderRadius: {
      small: string;
      medium: string;
      large: string;
    };
  };
  components: Array<{
    id: string;
    type: string;
    enabled: boolean;
    props: Record<string, any>;
  }>;
  features: {
    cart: boolean;
    search: boolean;
    filters: boolean;
    loyalty: boolean;
    ordering: boolean;
    payment: boolean;
  };
  businessRules: {
    priceModifiers: any[];
    availability: {
      check_inventory: boolean;
      real_time_sync: boolean;
    };
    ordering: {
      enabled: boolean;
      min_order_amount: number;
      delivery_enabled: boolean;
      pickup_enabled: boolean;
    };
  };
}

interface MenuData {
  menu: any;
  offers: any[];
  business: any;
  endpoint: any;
  template: {
    id: number;
    name: string;
    currency: string;
    settings: any;
    image_url?: string;
    config: MenuConfig;
  };
}

interface ApiDrivenMenuProps {
  code: string;
}

/**
 * API-Driven Menu Renderer
 * 
 * This component:
 * 1. Fetches configuration from API
 * 2. Injects design variables as CSS
 * 3. Renders components based on API config
 * 4. No hardcoded templates!
 */
export function ApiDrivenMenu({ code }: ApiDrivenMenuProps) {
  const [data, setData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMenuConfig();
  }, [code]);

  const fetchMenuConfig = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${apiUrl}/menu/${code}`);
      
      if (!response.ok) {
        throw new Error('Menu not found');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to load menu');
      }

      setData(result.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Menu Not Found</h2>
          <p className="text-gray-600">{error || 'This menu is not available'}</p>
        </div>
      </div>
    );
  }

  const config = data.template.config;

  // Build CSS variables from config
  const cssVariables = {
    '--color-primary': config.design.colors.primary,
    '--color-secondary': config.design.colors.secondary,
    '--color-background': config.design.colors.background,
    '--color-text': config.design.colors.text,
    '--color-accent': config.design.colors.accent,
    '--font-family': config.design.typography.fontFamily,
    '--font-weight-heading': config.design.typography.headingWeight,
    '--font-weight-body': config.design.typography.bodyWeight,
    '--spacing-container': config.design.spacing.container,
    '--spacing-section': config.design.spacing.section,
    '--spacing-card': config.design.spacing.card,
    '--border-radius-sm': config.design.borderRadius.small,
    '--border-radius-md': config.design.borderRadius.medium,
    '--border-radius-lg': config.design.borderRadius.large,
  } as React.CSSProperties;

  return (
    <div 
      className="min-h-screen"
      style={{
        ...cssVariables,
        backgroundColor: config.design.colors.background,
        color: config.design.colors.text,
        fontFamily: config.design.typography.fontFamily,
      }}
    >
      {/* Render components based on API configuration */}
      <DynamicComponentRenderer
        components={config.components}
        data={data}
        config={config}
      />
    </div>
  );
}

/**
 * Dynamic Component Renderer
 * Renders components based on API configuration
 */
interface DynamicComponentRendererProps {
  components: MenuConfig['components'];
  data: MenuData;
  config: MenuConfig;
}

function DynamicComponentRenderer({ 
  components, 
  data, 
  config 
}: DynamicComponentRendererProps) {
  return (
    <>
      {components.map((component) => {
        if (!component.enabled) return null;

        switch (component.type) {
          case 'Header':
            return (
              <HeaderComponent
                key={component.id}
                business={data.business}
                endpoint={data.endpoint}
                config={config}
                {...component.props}
              />
            );

          case 'FeaturedItems':
            return (
              <FeaturedItemsComponent
                key={component.id}
                menu={data.menu}
                config={config}
                {...component.props}
              />
            );

          case 'MenuList':
            return (
              <MenuListComponent
                key={component.id}
                menu={data.menu}
                config={config}
                currency={data.template.currency}
                {...component.props}
              />
            );

          case 'GridMenuLayout':
            return (
              <GridMenuLayoutComponent
                key={component.id}
                menu={data.menu}
                config={config}
                currency={data.template.currency}
                {...component.props}
              />
            );

          case 'CartSheet':
            return (
              <CartSheetComponent
                key={component.id}
                config={config}
                currency={data.template.currency}
                {...component.props}
              />
            );

          case 'OffersCarousel':
            return (
              <OffersCarouselComponent
                key={component.id}
                offers={data.offers}
                config={config}
                {...component.props}
              />
            );

          default:
            console.warn(`Unknown component type: ${component.type}`);
            return null;
        }
      })}
    </>
  );
}

/**
 * Component Implementations
 * These are basic implementations - can be extended per business
 */

function HeaderComponent({ business, endpoint, config, showLogo, showCart, showSearch }: any) {
  return (
    <header 
      className="sticky top-0 z-40 backdrop-blur-md border-b"
      style={{ 
        backgroundColor: `${config.design.colors.background}ee`,
        borderColor: `${config.design.colors.primary}20`
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showLogo && business?.logo_url && (
              <img 
                src={business.logo_url} 
                alt={business.name}
                className="w-10 h-10 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="font-bold text-lg">{business?.name || endpoint?.name}</h1>
              {business?.branch_name && business.branch_name !== business.name && (
                <p className="text-sm opacity-70">{business.branch_name}</p>
              )}
            </div>
          </div>
          
          {showCart && (
            <button 
              className="p-2 rounded-full"
              style={{ backgroundColor: config.design.colors.primary, color: 'white' }}
            >
              🛒
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function FeaturedItemsComponent({ menu, config, maxItems }: any) {
  const featuredItems = menu?.categories
    ?.flatMap((cat: any) => cat.items)
    .filter((item: any) => item.is_featured)
    .slice(0, maxItems || 6);

  if (!featuredItems || featuredItems.length === 0) return null;

  return (
    <section style={{ padding: config.design.spacing.section }}>
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-4">Featured Items ⭐</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {featuredItems.map((item: any) => (
            <div 
              key={item.id}
              className="rounded-lg overflow-hidden border"
              style={{ 
                borderRadius: config.design.borderRadius.medium,
                backgroundColor: config.design.colors.background,
              }}
            >
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-32 object-cover" />
              ) : (
                <div className="w-full h-32 flex items-center justify-center text-4xl bg-gray-100">
                  {item.icon || '🍽️'}
                </div>
              )}
              <div className="p-3">
                <h3 className="font-semibold">{item.name}</h3>
                <p 
                  className="text-sm font-bold mt-1"
                  style={{ color: config.design.colors.primary }}
                >
                  Rs. {item.price}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MenuListComponent({ menu, config, currency, showImages, showDescriptions, showPrices }: any) {
  return (
    <section style={{ padding: config.design.spacing.section }}>
      <div className="max-w-6xl mx-auto px-4">
        {menu?.categories?.map((category: any) => (
          <div key={category.id} className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              {category.icon && <span>{category.icon}</span>}
              {category.name}
            </h2>
            
            <div className="space-y-3">
              {category.items?.map((item: any) => (
                <div 
                  key={item.id}
                  className="p-4 rounded-lg border flex gap-4"
                  style={{ 
                    borderRadius: config.design.borderRadius.medium,
                    backgroundColor: config.design.colors.background,
                  }}
                >
                  {showImages && (item.image_url || item.icon) && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center bg-gray-100">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">{item.icon || '🍽️'}</span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    {showDescriptions && item.description && (
                      <p className="text-sm opacity-70 mt-1">{item.description}</p>
                    )}
                    {showPrices && (
                      <p 
                        className="text-lg font-bold mt-2"
                        style={{ color: config.design.colors.primary }}
                      >
                        {currency} {item.price}
                      </p>
                    )}
                  </div>
                  
                  <button
                    className="px-4 py-2 rounded-lg text-white self-start"
                    style={{ 
                      backgroundColor: config.design.colors.primary,
                      borderRadius: config.design.borderRadius.small,
                    }}
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function GridMenuLayoutComponent({ menu, config, currency, columns, showImages }: any) {
  const gridCols = columns || 2;
  
  return (
    <section style={{ padding: config.design.spacing.section }}>
      <div className="max-w-6xl mx-auto px-4">
        {menu?.categories?.map((category: any) => (
          <div key={category.id} className="mb-8">
            <h2 className="text-xl font-bold mb-4">{category.name}</h2>
            
            <div 
              className="grid gap-4"
              style={{ 
                gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` 
              }}
            >
              {category.items?.map((item: any) => (
                <div 
                  key={item.id}
                  className="rounded-lg overflow-hidden border"
                  style={{ 
                    borderRadius: config.design.borderRadius.medium,
                    backgroundColor: config.design.colors.background,
                  }}
                >
                  {showImages && (item.image_url || item.icon) && (
                    <div className="w-full h-32 flex items-center justify-center bg-gray-100">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">{item.icon || '🍽️'}</span>
                      )}
                    </div>
                  )}
                  
                  <div className="p-3">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p 
                      className="text-lg font-bold mt-2"
                      style={{ color: config.design.colors.primary }}
                    >
                      {currency} {item.price}
                    </p>
                    <button
                      className="w-full mt-2 py-2 rounded-lg text-white"
                      style={{ 
                        backgroundColor: config.design.colors.primary,
                        borderRadius: config.design.borderRadius.small,
                      }}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CartSheetComponent({ config, currency, position }: any) {
  // Cart implementation - placeholder
  return null;
}

function OffersCarouselComponent({ offers, config, autoplay, interval }: any) {
  if (!offers || offers.length === 0) return null;
  
  return (
    <section style={{ padding: config.design.spacing.section }}>
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-4">Special Offers 🎉</h2>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {offers.map((offer: any) => (
            <div 
              key={offer.id}
              className="min-w-[300px] rounded-lg overflow-hidden border"
              style={{ 
                borderRadius: config.design.borderRadius.medium,
                backgroundColor: config.design.colors.background,
              }}
            >
              {offer.image_url && (
                <img src={offer.image_url} alt={offer.title} className="w-full h-40 object-cover" />
              )}
              <div className="p-4">
                <h3 className="font-bold">{offer.title}</h3>
                <p className="text-sm opacity-70 mt-1">{offer.description}</p>
                {offer.badge_text && (
                  <span 
                    className="inline-block px-2 py-1 rounded text-xs font-semibold mt-2"
                    style={{ 
                      backgroundColor: offer.badge_color || config.design.colors.accent,
                      color: 'white'
                    }}
                  >
                    {offer.badge_text}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ApiDrivenMenu;
