'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  QrCode,
  Edit2,
  Trash2,
  MoreVertical,
  Download,
  ExternalLink,
  TableProperties,
  Building2,
  Home,
  Coffee,
  ShoppingBag,
  Truck,
  Calendar,
  MapPin,
  Eye,
  RefreshCw,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from '@/contexts/location-context';
import { apiClient } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import { LoadingSpinner } from '@/components/loading/spinner';

interface MenuTemplate {
  id: number;
  name: string;
}

interface MenuEndpoint {
  id: number;
  template_id: number;
  type: 'table' | 'room' | 'area' | 'branch' | 'kiosk' | 'takeaway' | 'event' | 'delivery';
  name: string;
  identifier: string;
  description: string | null;
  short_code: string;
  short_url: string | null;
  qr_code_url: string | null;
  is_active: boolean;
  scan_count: number;
  last_scanned_at: string | null;
  created_at: string;
  template?: MenuTemplate;
}

type EndpointType = 'table' | 'room' | 'area' | 'branch' | 'kiosk' | 'takeaway' | 'event' | 'delivery';

const endpointTypes = [
  { value: 'table' as EndpointType, label: 'Table', icon: TableProperties, description: 'Restaurant tables' },
  { value: 'room' as EndpointType, label: 'Room', icon: Home, description: 'Private dining rooms' },
  { value: 'area' as EndpointType, label: 'Area', icon: MapPin, description: 'Sections or zones' },
  { value: 'branch' as EndpointType, label: 'Branch', icon: Building2, description: 'Multiple locations' },
  { value: 'kiosk' as EndpointType, label: 'Kiosk', icon: Coffee, description: 'Self-service kiosks' },
  { value: 'takeaway' as EndpointType, label: 'Takeaway', icon: ShoppingBag, description: 'Takeaway orders' },
  { value: 'delivery' as EndpointType, label: 'Delivery', icon: Truck, description: 'Delivery orders' },
  { value: 'event' as EndpointType, label: 'Event', icon: Calendar, description: 'Special events' },
];

function EndpointsPageContent() {
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get('template_id');

  const [endpoints, setEndpoints] = useState<MenuEndpoint[]>([]);
  const [templates, setTemplates] = useState<MenuTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    templateIdParam ? parseInt(templateIdParam) : null
  );

  // Dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const [isBulkCreateOpen, setIsBulkCreateOpen] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<MenuEndpoint | null>(null);
  const [qrCodeData, setQrCodeData] = useState<{ url: string; short_url: string } | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    type: EndpointType;
    identifier: string;
    description: string;
    template_id: number;
  }>({
    name: '',
    type: 'table',
    identifier: '',
    description: '',
    template_id: templateIdParam ? parseInt(templateIdParam) : 0,
  });

  const [bulkFormData, setBulkFormData] = useState<{
    type: EndpointType;
    template_id: number;
    prefix: string;
    start: number;
    count: number;
  }>({
    type: 'table',
    template_id: templateIdParam ? parseInt(templateIdParam) : 0,
    prefix: 'Table',
    start: 1,
    count: 10,
  });

  const { toast } = useToast();
  const { currentLocation } = useLocation();

  useEffect(() => {
    loadData();
  }, [currentLocation, selectedTemplateId, selectedType]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [endpointsRes, templatesRes] = await Promise.all([
        apiClient.getMenuEndpoints({
          location_id: currentLocation?.id ? parseInt(currentLocation.id) : undefined,
          template_id: selectedTemplateId || undefined,
          type: selectedType !== 'all' ? selectedType : undefined,
        }),
        apiClient.getMenuTemplates(currentLocation?.id ? parseInt(currentLocation.id) : undefined),
      ]);

      if (endpointsRes.success) {
        // Handle both formats: { data: [...] } or { data: { endpoints: [...] } }
        const endpointData = Array.isArray(endpointsRes.data) ? endpointsRes.data : (endpointsRes.data?.endpoints || []);
        setEndpoints(endpointData);
      }
      if (templatesRes.success) {
        // Handle both formats: { data: [...] } or { data: { templates: [...] } }
        const templateData = Array.isArray(templatesRes.data) ? templatesRes.data : (templatesRes.data?.templates || []);
        setTemplates(templateData);
        // Auto-select first template if none selected
        if (!selectedTemplateId && templateData.length > 0) {
          setFormData((prev) => ({ ...prev, template_id: templateData[0].id }));
          setBulkFormData((prev) => ({ ...prev, template_id: templateData[0].id }));
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      // Auto-generate identifier from name if not provided
      const identifier = formData.identifier.trim() || formData.name.replace(/\s+/g, '-').toLowerCase();
      const data = {
        ...formData,
        identifier,
        location_id: currentLocation?.id ? parseInt(currentLocation.id) : undefined,
      };
      console.log('Creating endpoint with data:', data);
      const response = await apiClient.createMenuEndpoint(data);
      console.log('Create response:', response);
      if (response.success) {
        toast({ title: 'Success', description: 'Endpoint created successfully' });
        setIsCreateOpen(false);
        resetForm();
        loadData();
      }
    } catch (error: any) {
      console.error('Create endpoint error:', error);
      const errorMsg = error.errors 
        ? Object.values(error.errors).flat().join(', ')
        : error.message || 'Failed to create endpoint';
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
    }
  };

  const handleBulkCreate = async () => {
    try {
      const response = await apiClient.bulkCreateMenuEndpoints({
        template_id: bulkFormData.template_id,
        type: bulkFormData.type,
        prefix: bulkFormData.prefix,
        start_number: bulkFormData.start,
        count: bulkFormData.count,
        location_id: currentLocation?.id ? parseInt(currentLocation.id) : undefined,
      });
      if (response.success) {
        toast({
          title: 'Success',
          description: `${bulkFormData.count} endpoints created successfully`,
        });
        setIsBulkCreateOpen(false);
        loadData();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create endpoints',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = async () => {
    if (!selectedEndpoint) return;
    try {
      const response = await apiClient.updateMenuEndpoint(selectedEndpoint.id, formData);
      if (response.success) {
        toast({ title: 'Success', description: 'Endpoint updated successfully' });
        setIsEditOpen(false);
        setSelectedEndpoint(null);
        loadData();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update endpoint',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedEndpoint) return;
    try {
      const response = await apiClient.deleteMenuEndpoint(selectedEndpoint.id);
      if (response.success) {
        toast({ title: 'Success', description: 'Endpoint deleted successfully' });
        setIsDeleteOpen(false);
        setSelectedEndpoint(null);
        loadData();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete endpoint',
        variant: 'destructive',
      });
    }
  };

  const handleViewQR = async (endpoint: MenuEndpoint) => {
    try {
      const response = await apiClient.getEndpointQRCode(endpoint.id);
      if (response.success) {
        // Map backend response to expected format
        setQrCodeData({
          url: response.data.qr_code_url,
          short_url: response.data.short_url || response.data.menu_url,
        });
        setSelectedEndpoint(endpoint);
        setIsQROpen(true);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load QR code',
        variant: 'destructive',
      });
    }
  };

  const handleRegenerateQR = async () => {
    if (!selectedEndpoint) return;
    try {
      const response = await apiClient.regenerateEndpointQR(selectedEndpoint.id);
      if (response.success) {
        toast({ title: 'Success', description: 'QR code regenerated' });
        // Reload the QR data
        const qrResponse = await apiClient.getEndpointQRCode(selectedEndpoint.id);
        if (qrResponse.success) {
          setQrCodeData({
            url: qrResponse.data.qr_code_url,
            short_url: qrResponse.data.short_url || qrResponse.data.menu_url,
          });
        }
        loadData();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to regenerate QR code',
        variant: 'destructive',
      });
    }
  };

  const handleCopyLink = async () => {
    if (!qrCodeData?.short_url) return;
    try {
      await navigator.clipboard.writeText(qrCodeData.short_url);
      toast({ title: 'Copied!', description: 'Menu link copied to clipboard' });
    } catch {
      toast({ title: 'Error', description: 'Failed to copy link', variant: 'destructive' });
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeData?.url || !selectedEndpoint) return;
    const link = document.createElement('a');
    link.href = qrCodeData.url;
    link.download = `qr-${selectedEndpoint.identifier}.png`;
    link.click();
  };

  const openEditDialog = (endpoint: MenuEndpoint) => {
    setSelectedEndpoint(endpoint);
    setFormData({
      name: endpoint.name,
      type: endpoint.type,
      identifier: endpoint.identifier,
      description: endpoint.description || '',
      template_id: endpoint.template_id,
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (endpoint: MenuEndpoint) => {
    setSelectedEndpoint(endpoint);
    setIsDeleteOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'table',
      identifier: '',
      description: '',
      template_id: templates[0]?.id || 0,
    });
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = endpointTypes.find((t) => t.value === type);
    return typeConfig?.icon || TableProperties;
  };

  const getTypeLabel = (type: string) => {
    const typeConfig = endpointTypes.find((t) => t.value === type);
    return typeConfig?.label || type;
  };

  const filteredEndpoints = endpoints.filter((endpoint) =>
    endpoint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    endpoint.identifier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Tables & QR Codes</h1>
          <p className="text-neutral-500 mt-1">
            Create tables, generate QR codes, and manage where customers can scan to view your menu
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsBulkCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Bulk Create Tables
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Table
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
          <Input
            placeholder="Search endpoints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="h-10 px-3 rounded-md border border-neutral-200 bg-white"
        >
          <option value="all">All Types</option>
          {endpointTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <select
          value={selectedTemplateId || ''}
          onChange={(e) => setSelectedTemplateId(e.target.value ? parseInt(e.target.value) : null)}
          className="h-10 px-3 rounded-md border border-neutral-200 bg-white"
        >
          <option value="">All Templates</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>

      {/* No Templates Warning */}
      {templates.length === 0 && (
        <Card className="p-6 bg-amber-50 border-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <TableProperties className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium text-amber-900">No Menu Templates</h3>
              <p className="text-sm text-amber-700">
                Create a menu template first before adding endpoints.
              </p>
            </div>
            <Button variant="outline" className="ml-auto" asChild>
              <a href="/dashboard/templates">Create Template</a>
            </Button>
          </div>
        </Card>
      )}

      {/* Endpoints Grid */}
      {templates.length > 0 && filteredEndpoints.length === 0 ? (
        <Card className="p-12 text-center">
          <TableProperties className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">No Endpoints Yet</h3>
          <p className="text-neutral-500 mb-6">
            Create endpoints for your tables, rooms, or branches
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setIsBulkCreateOpen(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Bulk Create Tables
            </Button>
            <Button onClick={() => setIsCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Endpoint
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filteredEndpoints.map((endpoint, index) => {
              const TypeIcon = getTypeIcon(endpoint.type);
              return (
                <motion.div
                  key={endpoint.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="hover:shadow-lg transition-shadow group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <TypeIcon className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{endpoint.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {endpoint.identifier}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {getTypeLabel(endpoint.type)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewQR(endpoint)}>
                              <QrCode className="w-4 h-4 mr-2" />
                              View QR Code
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(endpoint)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(endpoint)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {endpoint.description && (
                          <p className="text-sm text-neutral-500 line-clamp-2">
                            {endpoint.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-neutral-500">Scans</span>
                          <Badge variant="secondary">{endpoint.scan_count}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleViewQR(endpoint)}
                          >
                            <QrCode className="w-3 h-3 mr-1" />
                            QR Code
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => openEditDialog(endpoint)}
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={() => { setIsCreateOpen(false); setIsEditOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditOpen ? 'Edit Endpoint' : 'Create Endpoint'}</DialogTitle>
            <DialogDescription>
              {isEditOpen
                ? 'Update the endpoint details'
                : 'Create a new endpoint for your menu'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Template *</Label>
              <select
                value={formData.template_id}
                onChange={(e) => setFormData({ ...formData, template_id: parseInt(e.target.value) })}
                className="w-full h-10 px-3 rounded-md border border-neutral-200 bg-white"
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Type *</Label>
              <div className="grid grid-cols-4 gap-2">
                {endpointTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value as any })}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        formData.type === type.value
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      <Icon className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-xs">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  placeholder="e.g., Table 1, VIP Room"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Identifier (auto-generated if empty)</Label>
                <Input
                  placeholder="e.g., T1, VIP1"
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional notes about this endpoint"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}>
              Cancel
            </Button>
            <Button
              onClick={isEditOpen ? handleEdit : handleCreate}
              disabled={!formData.name.trim() || !formData.template_id}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isEditOpen ? 'Save Changes' : 'Create Endpoint'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Create Dialog */}
      <Dialog open={isBulkCreateOpen} onOpenChange={setIsBulkCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Create Endpoints</DialogTitle>
            <DialogDescription>
              Quickly create multiple endpoints (e.g., Table 1-20)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Template *</Label>
              <select
                value={bulkFormData.template_id}
                onChange={(e) => setBulkFormData({ ...bulkFormData, template_id: parseInt(e.target.value) })}
                className="w-full h-10 px-3 rounded-md border border-neutral-200 bg-white"
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <select
                value={bulkFormData.type}
                onChange={(e) => setBulkFormData({ ...bulkFormData, type: e.target.value as any })}
                className="w-full h-10 px-3 rounded-md border border-neutral-200 bg-white"
              >
                {endpointTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Name Prefix</Label>
              <Input
                placeholder="e.g., Table, Room"
                value={bulkFormData.prefix}
                onChange={(e) => setBulkFormData({ ...bulkFormData, prefix: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Number</Label>
                <Input
                  type="number"
                  min="1"
                  value={bulkFormData.start}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, start: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Count</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={bulkFormData.count}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, count: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg">
              <p className="text-sm text-neutral-600">
                Preview: {bulkFormData.prefix} {bulkFormData.start} to {bulkFormData.prefix}{' '}
                {bulkFormData.start + bulkFormData.count - 1}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkCreate}
              disabled={!bulkFormData.template_id || !bulkFormData.prefix.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Create {bulkFormData.count} Endpoints
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={isQROpen} onOpenChange={setIsQROpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedEndpoint?.name} - QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code to view the menu
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center">
            {qrCodeData?.url ? (
              <div className="bg-white p-4 rounded-xl shadow-inner border">
                <img
                  src={qrCodeData.url}
                  alt="QR Code"
                  className="w-64 h-64"
                />
              </div>
            ) : (
              <div className="w-64 h-64 bg-neutral-100 rounded-xl flex items-center justify-center">
                <QrCode className="w-16 h-16 text-neutral-300" />
              </div>
            )}
            {qrCodeData?.short_url && (
              <div className="mt-4 p-3 bg-neutral-50 rounded-lg w-full">
                <p className="text-xs text-neutral-500 mb-1">Menu URL</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm flex-1 truncate">{qrCodeData.short_url}</code>
                  <Button variant="ghost" size="icon" onClick={handleCopyLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <a href={qrCodeData.short_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleRegenerateQR} className="w-full sm:w-auto">
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
            <Button onClick={handleDownloadQR} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
              <Download className="w-4 h-4 mr-2" />
              Download QR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Endpoint</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedEndpoint?.name}"? The QR code will no longer work.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Endpoint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function EndpointsPage() {
  return (
    <Suspense fallback={
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    }>
      <EndpointsPageContent />
    </Suspense>
  );
}
