'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Eye, Sparkles, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClassicMenuTemplate } from '@/app/m/[code]/templates/ClassicMenuTemplate';
import { MinimalMenuTemplate } from '@/app/m/[code]/templates/MinimalMenuTemplate';
import { PremiumMenuTemplate } from '@/app/m/[code]/templates/PremiumMenuTemplate';
import { useSubscription } from '@/contexts/subscription-context';
import { useRouter } from 'next/navigation';

// Sample menu data for preview
const sampleMenuData = {
  endpoint: {
    id: 1,
    name: 'Sample Restaurant',
    identifier: 'SAMPLE',
    is_active: true,
  },
  template: {
    id: 1,
    name: 'Sample Menu',
    currency: 'USD',
    image_url: null,
    settings: {
      layout: 'standard',
      colorTheme: 'modern',
      template_type: 'classic',
    },
    type: 'classic',
  },
  business: {
    name: 'Sample Restaurant',
    branch_name: 'Downtown',
    description: 'Fresh, delicious food made with love',
    logo_url: null,
    phone: '+1 (555) 123-4567',
    email: 'info@sample.com',
    website: 'https://sample.com',
    address: ['123 Main St', 'Suite 100', 'City, State 12345'],
    cuisine_type: 'Italian',
    operating_hours: null,
    services: ['Dine-in', 'Takeout', 'Delivery'],
    primary_color: '#3B82F6',
  },
  categories: [
    {
      id: 1,
      name: 'Appetizers',
      description: 'Start your meal right',
      icon: '🥗',
      items: [
        {
          id: 1,
          name: 'Bruschetta',
          description: 'Toasted bread topped with fresh tomatoes, basil, and olive oil',
          price: 8.99,
          compare_at_price: null,
          image_url: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400',
          icon: null,
          is_available: true,
          is_featured: true,
          is_spicy: false,
          spice_level: null,
          allergens: ['gluten'],
          dietary_info: ['vegetarian'],
          preparation_time: 10,
          variations: null,
        },
        {
          id: 2,
          name: 'Calamari',
          description: 'Crispy fried squid served with marinara sauce',
          price: 12.99,
          compare_at_price: 14.99,
          image_url: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400',
          icon: null,
          is_available: true,
          is_featured: false,
          is_spicy: false,
          spice_level: null,
          allergens: ['seafood'],
          dietary_info: null,
          preparation_time: 15,
          variations: null,
        },
      ],
    },
    {
      id: 2,
      name: 'Main Courses',
      description: 'Our signature dishes',
      icon: '🍝',
      items: [
        {
          id: 3,
          name: 'Spaghetti Carbonara',
          description: 'Classic Italian pasta with eggs, cheese, and pancetta',
          price: 16.99,
          compare_at_price: null,
          image_url: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400',
          icon: null,
          is_available: true,
          is_featured: true,
          is_spicy: false,
          spice_level: null,
          allergens: ['gluten', 'dairy', 'eggs'],
          dietary_info: null,
          preparation_time: 20,
          variations: null,
        },
        {
          id: 4,
          name: 'Margherita Pizza',
          description: 'Fresh mozzarella, tomatoes, and basil on our homemade crust',
          price: 14.99,
          compare_at_price: null,
          image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
          icon: null,
          is_available: true,
          is_featured: false,
          is_spicy: false,
          spice_level: null,
          allergens: ['gluten', 'dairy'],
          dietary_info: ['vegetarian'],
          preparation_time: 15,
          variations: null,
        },
        {
          id: 5,
          name: 'Grilled Salmon',
          description: 'Fresh Atlantic salmon with lemon butter sauce and vegetables',
          price: 22.99,
          compare_at_price: null,
          image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
          icon: null,
          is_available: true,
          is_featured: true,
          is_spicy: false,
          spice_level: null,
          allergens: ['fish'],
          dietary_info: null,
          preparation_time: 25,
          variations: null,
        },
      ],
    },
    {
      id: 3,
      name: 'Desserts',
      description: 'Sweet endings',
      icon: '🍰',
      items: [
        {
          id: 6,
          name: 'Tiramisu',
          description: 'Classic Italian dessert with coffee-soaked ladyfingers',
          price: 7.99,
          compare_at_price: null,
          image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
          icon: null,
          is_available: true,
          is_featured: true,
          is_spicy: false,
          spice_level: null,
          allergens: ['dairy', 'eggs', 'gluten'],
          dietary_info: null,
          preparation_time: 5,
          variations: null,
        },
      ],
    },
  ],
  offers: [],
  overrides: {},
};

const templates = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional restaurant menu with elegant list layout',
    preview: '📜',
    isPremium: false,
    features: ['List layout', 'Category navigation', 'Detailed descriptions', 'Print-friendly'],
    component: ClassicMenuTemplate,
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and simple grid-based modern design',
    preview: '🎯',
    isPremium: false,
    features: ['Grid layout', 'Large images', 'Quick view', 'Bottom sheet cart'],
    component: MinimalMenuTemplate,
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Full-featured luxury template with advanced animations',
    preview: '✨',
    isPremium: true,
    features: ['Top picks carousel', 'Advanced animations', 'Rating display', 'Special offers'],
    component: PremiumMenuTemplate,
    badge: 'Paid Plans Only',
  },
];

const colorThemes = [
  { id: 'modern', name: 'Modern Blue', colors: { bg: '#F8FAFC', accent: '#3B82F6' } },
  { id: 'classic', name: 'Warm Amber', colors: { bg: '#FEF3C7', accent: '#D97706' } },
  { id: 'minimal', name: 'Grayscale', colors: { bg: '#FFFFFF', accent: '#71717A' } },
  { id: 'elegant', name: 'Royal Purple', colors: { bg: '#FAF5FF', accent: '#9333EA' } },
  { id: 'rustic', name: 'Rustic Red', colors: { bg: '#FEF2F2', accent: '#B91C1C' } },
  { id: 'coffee', name: 'Coffee Brown', colors: { bg: '#FFF8F0', accent: '#C87941' } },
  { id: 'ocean', name: 'Ocean Blue', colors: { bg: '#F0F9FF', accent: '#0EA5E9' } },
  { id: 'forest', name: 'Forest Green', colors: { bg: '#F0FDF4', accent: '#22C55E' } },
];

export default function TemplatePreviewPage() {
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [selectedTheme, setSelectedTheme] = useState(colorThemes[0]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { canAccessFeature } = useSubscription();
  const router = useRouter();

  const previewData = {
    ...sampleMenuData,
    template: {
      ...sampleMenuData.template,
      settings: {
        ...sampleMenuData.template.settings,
        colorTheme: selectedTheme.id,
        template_type: selectedTemplate.id,
      },
    },
  };

  const TemplateComponent = selectedTemplate.component;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/templates">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Template Gallery</h1>
                <p className="text-sm text-gray-500">Preview and customize your menu template</p>
              </div>
            </div>
            <Button 
              onClick={() => router.push('/dashboard/templates')}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Check className="w-4 h-4 mr-2" />
              Use This Template
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Template & Theme Selection */}
          <div className="lg:col-span-1 space-y-6">
            {/* Template Selection */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                Templates
              </h2>
              <div className="space-y-2">
                {templates.map((template) => {
                  const hasAccess = !template.isPremium || canAccessFeature('premium_templates');
                  const isSelected = selectedTemplate.id === template.id;

                  return (
                    <button
                      key={template.id}
                      onClick={() => hasAccess && setSelectedTemplate(template)}
                      disabled={!hasAccess}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50'
                          : hasAccess
                          ? 'border-gray-200 hover:border-gray-300 bg-white'
                          : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-2xl">{template.preview}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{template.name}</span>
                            {template.badge && !hasAccess && (
                              <Badge variant="secondary" className="text-xs">Premium</Badge>
                            )}
                            {isSelected && (
                              <Check className="w-4 h-4 text-emerald-600 ml-auto" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color Theme Selection */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-4">Color Themes</h2>
              <div className="grid grid-cols-2 gap-2">
                {colorThemes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme)}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      selectedTheme.id === theme.id
                        ? 'border-emerald-500 ring-2 ring-emerald-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: theme.colors.bg }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: theme.colors.accent }}
                      />
                      <span className="text-xs font-medium truncate">{theme.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-3">Features</h2>
              <ul className="space-y-2">
                {selectedTemplate.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Preview Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gray-100 border-b px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Live Preview</span>
                  <Badge variant="secondary" className="text-xs">
                    {selectedTemplate.name} • {selectedTheme.name}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPreviewOpen(true)}
                >
                  Full Screen
                </Button>
              </div>
              
              {/* Preview Container */}
              <div className="bg-gray-50 p-4">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ maxHeight: '800px' }}>
                  <div className="overflow-y-auto" style={{ maxHeight: '800px' }}>
                    <TemplateComponent menuData={previewData} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setIsPreviewOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Full Screen Preview</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPreviewOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                <TemplateComponent menuData={previewData} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
