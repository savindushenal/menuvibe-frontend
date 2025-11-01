'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FeatureBlocker } from '@/components/subscription/feature-blocker';
import { InlineFeatureBlock, LocationBlock, AnalyticsBlock, PhotoUploadBlock } from '@/components/subscription/inline-feature-block';
import { 
  MapPin, 
  BarChart3, 
  Camera, 
  Settings, 
  Users, 
  FileText,
  Download,
  Palette,
  Zap
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function BlockedFeaturesDemo() {
  const [demoStyle, setDemoStyle] = useState<'overlay' | 'card' | 'banner' | 'toast' | 'modal'>('overlay');
  const [showModal, setShowModal] = useState(false);

  // Mock content to show behind blocks
  const MockLocationManager = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Location Manager
        </CardTitle>
        <CardDescription>Manage multiple restaurant locations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium">Downtown Location</h4>
              <p className="text-sm text-gray-600">123 Main St, City</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium">Mall Location</h4>
              <p className="text-sm text-gray-600">456 Shopping Center</p>
            </div>
          </div>
          <Button className="w-full">Add New Location</Button>
        </div>
      </CardContent>
    </Card>
  );

  const MockAnalytics = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Advanced Analytics
        </CardTitle>
        <CardDescription>Detailed performance insights</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-2xl font-bold">1,234</div>
              <div className="text-xs text-gray-600">Total Views</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-2xl font-bold">89%</div>
              <div className="text-xs text-gray-600">Engagement</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-2xl font-bold">456</div>
              <div className="text-xs text-gray-600">Downloads</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-2xl font-bold">78</div>
              <div className="text-xs text-gray-600">Shares</div>
            </div>
          </div>
          <div className="h-32 bg-gradient-to-r from-purple-100 to-purple-200 rounded flex items-center justify-center">
            <span className="text-gray-600">Analytics Charts</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const MockPhotoUpload = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Menu Item Photos
        </CardTitle>
        <CardDescription>Upload beautiful photos for your menu items</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <Camera className="w-8 h-8 text-gray-400" />
              </div>
            ))}
          </div>
          <Button className="w-full">Upload Photos</Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">In-App Feature Blocking Demo</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          See how blocked features are presented to users directly within the application interface, 
          encouraging upgrades without disrupting the user experience.
        </p>
      </div>

      {/* Style Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Blocking Style</CardTitle>
          <CardDescription>Try different visual approaches to showing blocked features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(['overlay', 'card', 'banner', 'toast'] as const).map((style) => (
              <Button
                key={style}
                variant={demoStyle === style ? 'default' : 'outline'}
                onClick={() => setDemoStyle(style)}
                className="capitalize"
              >
                {style}
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={() => setShowModal(true)}
            >
              Modal
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feature Demos */}
      <Tabs defaultValue="locations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="locations">Multiple Locations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="photos">Photo Uploads</TabsTrigger>
          <TabsTrigger value="custom">Custom Features</TabsTrigger>
        </TabsList>

        <TabsContent value="locations" className="space-y-6">
          <div className="grid gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Multiple Locations - Pro Feature</h3>
              <FeatureBlocker
                feature="Multiple Locations"
                requiredPlan="pro"
                style={demoStyle}
                title="Manage Multiple Locations"
                description="Expand your restaurant business with location management tools"
                benefits={[
                  "Up to 3 locations",
                  "Individual menus per location",
                  "Location-specific analytics",
                  "Centralized management dashboard"
                ]}
                showDemo={true}
              >
                <MockLocationManager />
              </FeatureBlocker>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Advanced Analytics - Enterprise Feature</h3>
              <FeatureBlocker
                feature="Advanced Analytics"
                requiredPlan="enterprise"
                style={demoStyle}
                title="Detailed Performance Analytics"
                description="Get comprehensive insights into your menu performance"
                benefits={[
                  "Real-time analytics dashboard",
                  "Custom report generation",
                  "Performance insights",
                  "Data export capabilities",
                  "Conversion tracking"
                ]}
                showDemo={true}
              >
                <MockAnalytics />
              </FeatureBlocker>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="photos" className="space-y-6">
          <div className="grid gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Photo Uploads - Pro Feature</h3>
              <FeatureBlocker
                feature="Photo Uploads"
                requiredPlan="pro"
                style={demoStyle}
                title="Beautiful Menu Photos"
                description="Showcase your dishes with high-quality photos"
                benefits={[
                  "High-resolution photo uploads",
                  "Multiple photos per menu item",
                  "Automatic image optimization",
                  "Improved customer engagement"
                ]}
                showDemo={true}
              >
                <MockPhotoUpload />
              </FeatureBlocker>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Custom Branding */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Custom Branding</h3>
              <FeatureBlocker
                feature="Custom Branding"
                requiredPlan="custom-enterprise"
                style={demoStyle}
                title="White-Label Solution"
                description="Complete branding customization"
                benefits={[
                  "Remove MenuVibe branding",
                  "Custom colors and fonts",
                  "Your logo everywhere",
                  "Custom domain"
                ]}
                showDemo={true}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Brand Customization
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium">Your Restaurant Brand</h4>
                        <p className="text-sm text-gray-600">Fully customized appearance</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FeatureBlocker>
            </div>

            {/* API Access */}
            <div>
              <h3 className="text-lg font-semibold mb-2">API Access</h3>
              <FeatureBlocker
                feature="API Access"
                requiredPlan="enterprise"
                style={demoStyle}
                title="Developer API"
                description="Integrate with your existing systems"
                benefits={[
                  "RESTful API access",
                  "Webhook integrations",
                  "Real-time data sync",
                  "Custom integrations"
                ]}
                showDemo={true}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      API Integration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded font-mono text-sm">
                        GET /api/menus<br />
                        POST /api/menu-items<br />
                        PUT /api/locations
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </FeatureBlocker>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Preset Components Demo */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Preset Component Examples</h2>
        <p className="text-gray-600">Ready-to-use components for common blocking scenarios</p>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold mb-2">Location Block (Banner Style)</h3>
            <LocationBlock type="banner">
              <MockLocationManager />
            </LocationBlock>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Analytics Block (Replace Style)</h3>
            <AnalyticsBlock type="replace" />
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle>Best Practices for In-App Feature Blocking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">✅ Do</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Show preview of blocked content when possible</li>
                <li>• Clearly explain the value proposition</li>
                <li>• Use appropriate blocking style for context</li>
                <li>• Make upgrade path obvious and easy</li>
                <li>• Allow dismissing non-critical blocks</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-red-600">❌ Don't</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Block core functionality completely</li>
                <li>• Show too many blocks at once</li>
                <li>• Use aggressive or pushy language</li>
                <li>• Make blocks impossible to dismiss</li>
                <li>• Hide the value behind the upgrade</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Demo */}
      {showModal && (
        <FeatureBlocker
          feature="Custom Feature"
          requiredPlan="pro"
          style="modal"
          title="Feature Locked"
          description="This feature requires a Pro subscription"
          benefits={["Benefit 1", "Benefit 2", "Benefit 3"]}
          onDismiss={() => setShowModal(false)}
        />
      )}
    </div>
  );
}