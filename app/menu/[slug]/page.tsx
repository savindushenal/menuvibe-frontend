'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { extractPublicIdFromSlug, isValidSlug } from '@/lib/slug-utils';
import { ShoppingCart, Plus, Minus, X, User, Phone, Mail, Award } from 'lucide-react';

// Menu design templates
const menuDesigns = [
  {
    value: 'modern',
    label: 'Modern',
    colors: {
      bg: '#F8FAFC',
      text: '#1E293B',
      accent: '#3B82F6'
    }
  },
  {
    value: 'classic',
    label: 'Classic',
    colors: {
      bg: '#FEF3C7',
      text: '#78350F',
      accent: '#D97706'
    }
  },
  {
    value: 'minimal',
    label: 'Minimal',
    colors: {
      bg: '#FFFFFF',
      text: '#18181B',
      accent: '#71717A'
    }
  },
  {
    value: 'elegant',
    label: 'Elegant',
    colors: {
      bg: '#FAF5FF',
      text: '#581C87',
      accent: '#9333EA'
    }
  },
  {
    value: 'rustic',
    label: 'Rustic',
    colors: {
      bg: '#FEF2F2',
      text: '#7F1D1D',
      accent: '#B91C1C'
    }
  },
  {
    value: 'bold',
    label: 'Bold',
    colors: {
      bg: '#FEF9C3',
      text: '#7C2D12',
      accent: '#DC2626'
    }
  }
];

// Add custom styles for scrollbar hiding
const styles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

interface OrderForm {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  loyaltyNumber: string;
  notes: string;
  [key: string]: string; // Allow dynamic custom fields
}

export default function PublicMenuPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const tableNumber = searchParams.get('table');
  
  const [menu, setMenu] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<{ [key: number]: number }>({});
  const [showCart, setShowCart] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderingEnabled, setOrderingEnabled] = useState(false);
  const [requiresLoyalty, setRequiresLoyalty] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [customFormFields, setCustomFormFields] = useState<any[]>([]);
  const [defaultFieldsConfig, setDefaultFieldsConfig] = useState<any>({});
  const [loyaltyConfig, setLoyaltyConfig] = useState<any>({
    enabled: false,
    label: 'Loyalty Number',
    placeholder: 'Enter your loyalty number',
    required: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderForm, setOrderForm] = useState<OrderForm>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    loyaltyNumber: '',
    notes: ''
  });

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
        
        // Check menu customization settings
        const menuSettings = data.data.menu?.settings || {};
        const locationSettings = data.data.menu?.location_settings || {};
        const formConfig = data.data.menu?.order_form_config || {};
        
        // Enable ordering if restaurant has Pro or Enterprise subscription
        // The API will do final validation, but we show/hide UI based on settings
        const orderingConfig = menuSettings.ordering || locationSettings.ordering || {};
        setOrderingEnabled(orderingConfig.enabled !== false); // Default to true
        
        // Configure custom form fields
        if (formConfig.fields && Array.isArray(formConfig.fields)) {
          const enabledFields = formConfig.fields
            .filter((field: any) => field.enabled)
            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
          setCustomFormFields(enabledFields);
          
          // Initialize custom field values in form state
          const initialCustomFields: any = {};
          enabledFields.forEach((field: any) => {
            initialCustomFields[field.id] = '';
          });
          setOrderForm(prev => ({ ...prev, ...initialCustomFields }));
        }
        
        // Configure default fields (name, phone, email)
        if (formConfig.defaultFields) {
          setDefaultFieldsConfig(formConfig.defaultFields);
        }
        
        // Configure loyalty program settings (Enterprise feature)
        const loyaltySettings = menuSettings.loyalty || locationSettings.loyalty || {};
        if (loyaltySettings.enabled) {
          setRequiresLoyalty(loyaltySettings.required || false);
          setLoyaltyConfig({
            enabled: true,
            label: loyaltySettings.label || 'Loyalty Number',
            placeholder: loyaltySettings.placeholder || 'Enter your loyalty number',
            required: loyaltySettings.required || false,
            helpText: loyaltySettings.helpText || null
          });
        }
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

  // Cart functions
  const addToCart = (itemId: number) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) {
        newCart[itemId]--;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const getTotalItems = () => Object.values(cart).reduce((sum, count) => sum + count, 0);
  
  const getTotalPrice = () => {
    if (!menu?.items) return 0;
    return Object.entries(cart).reduce((sum, [itemId, count]) => {
      const item = menu.items.find((i: any) => i.id === parseInt(itemId));
      return sum + (item ? parseFloat(item.price) * count : 0);
    }, 0);
  };

  const handleCheckout = () => {
    setShowCart(false);
    setShowOrderForm(true);
  };

  const submitOrder = async () => {
    // Validation for default fields
    const nameConfig = defaultFieldsConfig.customerName || { enabled: true, required: true };
    const phoneConfig = defaultFieldsConfig.customerPhone || { enabled: true, required: true };
    const emailConfig = defaultFieldsConfig.customerEmail || { enabled: true, required: false };
    
    if (nameConfig.enabled && nameConfig.required && !orderForm.customerName.trim()) {
      alert(`Please provide your ${nameConfig.label || 'name'}`);
      return;
    }
    
    if (phoneConfig.enabled && phoneConfig.required && !orderForm.customerPhone.trim()) {
      alert(`Please provide your ${phoneConfig.label || 'phone number'}`);
      return;
    }
    
    if (emailConfig.enabled && emailConfig.required && !orderForm.customerEmail.trim()) {
      alert(`Please provide your ${emailConfig.label || 'email'}`);
      return;
    }

    // Validation for loyalty field
    if (loyaltyConfig.enabled && loyaltyConfig.required && !orderForm.loyaltyNumber.trim()) {
      alert(`Please provide your ${loyaltyConfig.label.toLowerCase()}`);
      return;
    }

    // Validation for custom fields
    for (const field of customFormFields) {
      if (field.required && !orderForm[field.id]?.trim()) {
        alert(`Please provide ${field.label}`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('customerName', orderForm.customerName);
      formData.append('customerPhone', orderForm.customerPhone);
      formData.append('customerEmail', orderForm.customerEmail);
      formData.append('loyaltyNumber', orderForm.loyaltyNumber);
      formData.append('notes', orderForm.notes);
      formData.append('tableNumber', tableNumber || '');
      
      // Add custom fields
      const customFieldsData: any = {};
      customFormFields.forEach(field => {
        if (orderForm[field.id]) {
          customFieldsData[field.id] = orderForm[field.id];
        }
      });
      if (Object.keys(customFieldsData).length > 0) {
        formData.append('customFields', JSON.stringify(customFieldsData));
      }
      
      // Convert cart to items array
      const items = Object.entries(cart).map(([itemId, quantity]) => {
        const item = menu.items.find((i: any) => i.id === parseInt(itemId));
        return {
          id: parseInt(itemId),
          name: item?.name || '',
          price: parseFloat(item?.price || 0),
          quantity
        };
      });
      
      formData.append('items', JSON.stringify(items));
      formData.append('totalAmount', getTotalPrice().toString());

      // Use the menu ID from the fetched menu data
      const response = await fetch(`/api/public/menu/${menu.menu.id}`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        setOrderSuccess(true);
        setCart({});
        
        // Reset form including custom fields
        const resetForm: OrderForm = {
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          loyaltyNumber: '',
          notes: ''
        };
        customFormFields.forEach(field => {
          resetForm[field.id] = '';
        });
        setOrderForm(resetForm);

        setTimeout(() => {
          setShowOrderForm(false);
          setOrderSuccess(false);
        }, 3000);
      } else {
        if (result.requiresUpgrade) {
          alert(`Online ordering is not available.\n\n${result.message}\n\nPlease contact the restaurant directly.`);
        } else {
          alert(result.message || 'Failed to place order. Please try again.');
        }
      }
    } catch (error) {
      console.error('Failed to place order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  // Get design colors based on menu style
  const menuStyle = menu.menu?.style || 'modern';
  const designColors = menuDesigns.find(d => d.value === menuStyle)?.colors || menuDesigns[0].colors;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="min-h-screen" style={{ backgroundColor: designColors.bg }}>
      {/* Header with restaurant branding */}
      <div 
        className="text-white py-6 shadow-lg sticky top-0 z-10"
        style={{
          backgroundColor: designColors.accent,
          background: `linear-gradient(135deg, ${designColors.accent} 0%, ${designColors.accent}dd 100%)`
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {menu.menu?.logo_url && (
                <img 
                  src={menu.menu.logo_url} 
                  alt={menu.menu.restaurant_name}
                  className="h-16 w-16 rounded-full bg-white p-1 object-cover shadow-md"
                  style={{ borderColor: designColors.accent, borderWidth: '2px' }}
                />
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{menu.menu?.restaurant_name || 'Restaurant'}</h1>
                <p className="text-sm md:text-base opacity-90">{menu.menu?.menu_name}</p>
                {tableNumber && (
                  <p className="text-xs md:text-sm opacity-75 mt-1">
                    Table #{tableNumber}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      {menu.categories && menu.categories.length > 1 && (
        <div className="bg-white border-b sticky top-[88px] md:top-[96px] z-10 shadow-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors"
                style={
                  selectedCategory === null
                    ? { backgroundColor: designColors.accent, color: '#FFFFFF' }
                    : { backgroundColor: '#F3F4F6', color: designColors.text }
                }
              >
                All Items
              </button>
              {menu.categories.map((category: any) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className="px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors"
                  style={
                    selectedCategory === category.id
                      ? { backgroundColor: designColors.accent, color: '#FFFFFF' }
                      : { backgroundColor: '#F3F4F6', color: designColors.text }
                  }
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Menu Content */}
      <div className="container mx-auto px-4 py-8">
        {menu.categories && menu.categories.length > 0 ? (
          <div className="space-y-8">
            {menu.categories
              .filter((category: any) => selectedCategory === null || category.id === selectedCategory)
              .map((category: any) => {
              // Filter items for this category
              const categoryItems = menu.items?.filter((item: any) => item.category_id === category.id) || [];
              
              return (
                <div key={category.id} className="bg-white rounded-lg shadow-sm p-6 border-2" style={{
                  borderColor: designColors.accent
                }}>
                  <h2 
                    className="text-2xl font-bold mb-4 border-b pb-2"
                    style={{
                      color: designColors.text,
                      borderColor: designColors.accent + '40'
                    }}
                  >
                    {category.name}
                  </h2>
                  {category.description && (
                    <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                  )}
                  {categoryItems.length > 0 ? (
                    <div className="space-y-3">
                      {categoryItems.map((item: any) => (
                        <div 
                          key={item.id} 
                          className="flex justify-between items-start border-b pb-3 last:border-0"
                          style={{
                            borderColor: designColors.accent + '40'
                          }}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium" style={{
                                color: designColors.text
                              }}>
                                {item.name}
                              </h4>
                              {item.is_spicy === true && <span className="text-red-500">🌶️</span>}
                              {item.is_available === false && (
                                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">Unavailable</span>
                              )}
                              {item.is_featured === true && (
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">⭐ Featured</span>
                              )}
                            </div>
                            {item.description && item.description !== '0' && (
                              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                            )}
                            {item.dietary_info && Array.isArray(item.dietary_info) && item.dietary_info.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.dietary_info.filter((info: string) => info && info !== '0').map((info: string, idx: number) => (
                                  <span key={idx} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                    {info}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="ml-4 text-right flex-shrink-0">
                            {item.image_url && (
                              <img 
                                src={item.image_url} 
                                alt={item.name}
                                className="w-24 h-24 object-cover rounded-lg mb-2"
                              />
                            )}
                            <div className="font-semibold mb-2" style={{
                              color: designColors.accent
                            }}>
                              ${parseFloat(item.price || 0).toFixed(2)}
                            </div>
                            {orderingEnabled && item.is_available && (
                              <div className="flex flex-col gap-2">
                                {cart[item.id] ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => removeFromCart(item.id)}
                                      className="w-8 h-8 rounded-full text-white flex items-center justify-center transition-opacity hover:opacity-80"
                                      style={{ backgroundColor: '#EF4444' }}
                                    >
                                      <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="font-bold min-w-[30px] text-center" style={{ color: designColors.text }}>{cart[item.id]}</span>
                                    <button
                                      onClick={() => addToCart(item.id)}
                                      className="w-8 h-8 rounded-full text-white flex items-center justify-center transition-opacity hover:opacity-80"
                                      style={{ backgroundColor: designColors.accent }}
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => addToCart(item.id)}
                                    className="px-4 py-2 rounded-lg text-white font-medium transition-opacity hover:opacity-80 flex items-center justify-center gap-2"
                                    style={{ backgroundColor: designColors.accent }}
                                  >
                                    <Plus className="w-4 h-4" />
                                    Add
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No items in this category</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="text-6xl mb-4">🍽️</div>
            <p className="text-xl font-semibold text-gray-700 mb-2">No Menu Items Available</p>
            <p className="text-gray-500">Please check back later or contact the restaurant.</p>
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {orderingEnabled && getTotalItems() > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 w-16 h-16 text-white rounded-full shadow-lg transition-all hover:scale-110 flex items-center justify-center z-50"
          style={{ backgroundColor: designColors.accent }}
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
            {getTotalItems()}
          </span>
        </button>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Your Cart</h3>
                {tableNumber && (
                  <p className="text-sm text-gray-500">Table #{tableNumber}</p>
                )}
              </div>
              <button
                onClick={() => setShowCart(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {Object.entries(cart).map(([itemId, quantity]) => {
                const item = menu?.items?.find((i: any) => i.id === parseInt(itemId));
                if (!item) return null;
                
                return (
                  <div key={itemId} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-500">${parseFloat(item.price).toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold min-w-[20px] text-center">{quantity}</span>
                        <button
                          onClick={() => addToCart(item.id)}
                          className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="font-bold min-w-[60px] text-right" style={{ color: designColors.accent }}>
                        ${(parseFloat(item.price) * quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="p-6 border-t bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold text-gray-900">Total:</span>
                <span className="text-2xl font-bold" style={{ color: designColors.accent }}>
                  ${getTotalPrice().toFixed(2)}
                </span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full py-3 text-white rounded-lg font-bold transition-opacity hover:opacity-90"
                style={{ backgroundColor: designColors.accent }}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
            {orderSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-green-600 mb-2">Order Placed!</h3>
                <p className="text-gray-600 mb-4">Thank you! The restaurant will contact you shortly.</p>
                <p className="text-sm text-gray-500">Estimated time: 20-30 minutes</p>
              </div>
            ) : (
              <>
                <div className="p-6 border-b flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Order Details</h3>
                  <button
                    onClick={() => setShowOrderForm(false)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-6 space-y-4">
                  {/* Default Fields */}
                  {(defaultFieldsConfig.customerName?.enabled !== false) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-2" />
                        {defaultFieldsConfig.customerName?.label || 'Full Name'} {defaultFieldsConfig.customerName?.required !== false && '*'}
                      </label>
                      <input
                        type="text"
                        value={orderForm.customerName}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, customerName: e.target.value }))}
                        placeholder={defaultFieldsConfig.customerName?.placeholder || "Enter your name"}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        required={defaultFieldsConfig.customerName?.required !== false}
                      />
                    </div>
                  )}

                  {(defaultFieldsConfig.customerPhone?.enabled !== false) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4 inline mr-2" />
                        {defaultFieldsConfig.customerPhone?.label || 'Phone Number'} {defaultFieldsConfig.customerPhone?.required !== false && '*'}
                      </label>
                      <input
                        type="tel"
                        value={orderForm.customerPhone}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                        placeholder={defaultFieldsConfig.customerPhone?.placeholder || "Enter your phone number"}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        required={defaultFieldsConfig.customerPhone?.required !== false}
                      />
                    </div>
                  )}

                  {(defaultFieldsConfig.customerEmail?.enabled !== false) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        {defaultFieldsConfig.customerEmail?.label || 'Email'} {defaultFieldsConfig.customerEmail?.required && '*'}
                      </label>
                      <input
                        type="email"
                        value={orderForm.customerEmail}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                        placeholder={defaultFieldsConfig.customerEmail?.placeholder || "Enter your email"}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        required={defaultFieldsConfig.customerEmail?.required}
                      />
                    </div>
                  )}

                  {/* Custom Form Fields */}
                  {customFormFields.map((field) => (
                    <div key={field.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label} {field.required && '*'}
                      </label>
                      
                      {field.type === 'text' && (
                        <input
                          type="text"
                          value={orderForm[field.id] || ''}
                          onChange={(e) => setOrderForm(prev => ({ ...prev, [field.id]: e.target.value }))}
                          placeholder={field.placeholder || ''}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          required={field.required}
                        />
                      )}
                      
                      {field.type === 'textarea' && (
                        <textarea
                          value={orderForm[field.id] || ''}
                          onChange={(e) => setOrderForm(prev => ({ ...prev, [field.id]: e.target.value }))}
                          placeholder={field.placeholder || ''}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                          required={field.required}
                        />
                      )}
                      
                      {field.type === 'select' && (
                        <select
                          value={orderForm[field.id] || ''}
                          onChange={(e) => setOrderForm(prev => ({ ...prev, [field.id]: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          required={field.required}
                        >
                          <option value="">Select...</option>
                          {field.options?.map((option: string, idx: number) => (
                            <option key={idx} value={option}>{option}</option>
                          ))}
                        </select>
                      )}
                      
                      {field.type === 'radio' && (
                        <div className="space-y-2">
                          {field.options?.map((option: string, idx: number) => (
                            <label key={idx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={field.id}
                                value={option}
                                checked={orderForm[field.id] === option}
                                onChange={(e) => setOrderForm(prev => ({ ...prev, [field.id]: e.target.value }))}
                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                                required={field.required && idx === 0}
                              />
                              <span className="text-sm text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {field.helpText && (
                        <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
                      )}
                    </div>
                  ))}

                  {loyaltyConfig.enabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Award className="w-4 h-4 inline mr-2" />
                        {loyaltyConfig.label} {loyaltyConfig.required && '*'}
                      </label>
                      <input
                        type="text"
                        value={orderForm.loyaltyNumber}
                        onChange={(e) => setOrderForm(prev => ({ ...prev, loyaltyNumber: e.target.value }))}
                        placeholder={loyaltyConfig.placeholder}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        required={loyaltyConfig.required}
                      />
                      {loyaltyConfig.helpText && (
                        <p className="text-xs text-gray-500 mt-1">{loyaltyConfig.helpText}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Instructions (Optional)
                    </label>
                    <textarea
                      value={orderForm.notes}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any special requests or dietary requirements..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Order Summary</h4>
                    <div className="space-y-2">
                      {Object.entries(cart).map(([itemId, quantity]) => {
                        const item = menu?.items?.find((i: any) => i.id === parseInt(itemId));
                        if (!item) return null;
                        return (
                          <div key={itemId} className="flex justify-between text-sm">
                            <span className="text-gray-600">{quantity}x {item.name}</span>
                            <span className="font-medium">${(parseFloat(item.price) * quantity).toFixed(2)}</span>
                          </div>
                        );
                      })}
                      <div className="border-t pt-2 flex justify-between font-bold">
                        <span>Total:</span>
                        <span style={{ color: designColors.accent }}>${getTotalPrice().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 border-t bg-gray-50 flex gap-3">
                  <button
                    onClick={() => {
                      setShowOrderForm(false);
                      setShowCart(true);
                    }}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                  >
                    Back to Cart
                  </button>
                  <button
                    onClick={submitOrder}
                    disabled={isSubmitting || !orderForm.customerName.trim() || !orderForm.customerPhone.trim() || (loyaltyConfig.enabled && loyaltyConfig.required && !orderForm.loyaltyNumber.trim())}
                    className="flex-1 py-3 text-white rounded-lg font-bold transition-opacity hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    style={isSubmitting || !orderForm.customerName.trim() || !orderForm.customerPhone.trim() ? {} : { backgroundColor: designColors.accent }}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </div>
                    ) : (
                      'Place Order'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="bg-white border-t mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>Powered by MenuVibe</p>
          {menu.menu?.phone && (
            <p className="mt-2">📞 {menu.menu.phone}</p>
          )}
          {menu.menu?.website && (
            <a 
              href={menu.menu.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:underline mt-1 inline-block"
              style={{ color: designColors.accent }}
            >
              Visit Website
            </a>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
