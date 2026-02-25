'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  QrCode,
  Edit2,
  Trash2,
  Download,
  TableProperties,
  Building2,
  Home,
  Coffee,
  ShoppingBag,
  Truck,
  Calendar,
  MapPin,
  RefreshCw,
  Copy,
  Eye,
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface MenuEndpoint {
  id: number;
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
  template_id?: number;
  location_id?: number;
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

export default function FranchiseTablesQRPage() {
  const params = useParams();
  const franchiseSlug = params?.franchise as string;

  const [endpoints, setEndpoints] = useState<MenuEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [templates, setTemplates] = useState<Array<{ id: number; name: string; location?: { name: string } }>>([]);
  const [locations, setLocations] = useState<Array<{ id: number; name: string; branch_name?: string; branch_code?: string; logo_url?: string | null }>>([]);
  const [franchiseLogo, setFranchiseLogo] = useState<string | null>(null);

  // Dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const [isBulkCreateOpen, setIsBulkCreateOpen] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<MenuEndpoint | null>(null);
  const [qrCodeData, setQrCodeData] = useState<{ url: string; short_url: string; qr_code_url: string } | null>(null);

  // Loading states for actions
  const [isCreating, setIsCreating] = useState(false);
  const [isBulkCreating, setIsBulkCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Generate QR with ECL=H + logo in center on a canvas
  const generateQrWithLogo = useCallback(async (url: string, logoSrc: string | null): Promise<string> => {
    const QRCode = (await import('qrcode')).default;
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    await QRCode.toCanvas(canvas, url, {
      errorCorrectionLevel: 'H',
      width: size,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });
    const ctx = canvas.getContext('2d')!;
    if (logoSrc) {
      try {
        const logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = logoSrc;
        });
        const logoBox = Math.round(size * 0.20);  // 20% — safe within ECL-H 30% tolerance
        const logoPad = Math.round(logoBox * 0.12);
        const logoSize = logoBox - logoPad * 2;
        const x = Math.round((size - logoBox) / 2);
        const y = Math.round((size - logoBox) / 2);
        const radius = Math.round(logoBox * 0.18);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + logoBox - radius, y);
        ctx.quadraticCurveTo(x + logoBox, y, x + logoBox, y + radius);
        ctx.lineTo(x + logoBox, y + logoBox - radius);
        ctx.quadraticCurveTo(x + logoBox, y + logoBox, x + logoBox - radius, y + logoBox);
        ctx.lineTo(x + radius, y + logoBox);
        ctx.quadraticCurveTo(x, y + logoBox, x, y + logoBox - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
        ctx.drawImage(logoImg, x + logoPad, y + logoPad, logoSize, logoSize);
      } catch {
        // proceed without logo overlay
      }
    }
    return canvas.toDataURL('image/png');
  }, []);

  // Re-generate QR whenever the dialog opens
  useEffect(() => {
    if (!isQROpen || !qrCodeData) { setQrDataUrl(null); return; }
    const url = qrCodeData.short_url || qrCodeData.url;
    const endpointLocation = locations.find(l => l.id === selectedEndpoint?.location_id) ?? locations[0];
    const logoSrc = endpointLocation?.logo_url || franchiseLogo || null;
    generateQrWithLogo(url, logoSrc).then(setQrDataUrl).catch(() => setQrDataUrl(null));
  }, [isQROpen, qrCodeData, selectedEndpoint, locations, franchiseLogo, generateQrWithLogo]);

  const [formData, setFormData] = useState<{
    name: string;
    type: EndpointType;
    identifier: string;
    description: string;
    template_id?: number;
    location_id?: number;
  }>({
    name: '',
    type: 'table',
    identifier: '',
    description: '',
    template_id: undefined,
    location_id: undefined,
  });

  const [bulkFormData, setBulkFormData] = useState<{
    type: EndpointType;
    prefix: string;
    start: number;
    count: number;
    template_id?: number;
    location_id?: number;
  }>({
    type: 'table',
    prefix: 'Table',
    start: 1,
    count: 10,
    template_id: undefined,
    location_id: undefined,
  });

  useEffect(() => {
    loadEndpoints();
    loadTemplates();
    loadLocations();
  }, [franchiseSlug, selectedType]);

  useEffect(() => {
    if (franchiseSlug) loadFranchiseLogo();
  }, [franchiseSlug]);

  const loadEndpoints = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/franchise/${franchiseSlug}/endpoints`);
      if (response.data.success) {
        let data = response.data.data || [];
        if (selectedType !== 'all') {
          data = data.filter((e: MenuEndpoint) => e.type === selectedType);
        }
        setEndpoints(data);
      }
    } catch (error: any) {
      console.error('Failed to load endpoints:', error);
      toast.error(error.response?.data?.message || 'Failed to load tables & QR codes');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await api.get(`/franchise/${franchiseSlug}/templates`);
      if (response.data.success) {
        const templatesData = response.data.data || [];
        setTemplates(templatesData);
        // Set default template_id if available
        if (templatesData.length > 0) {
          const defaultTemplate = templatesData.find((t: any) => t.is_default) || templatesData[0];
          setFormData(prev => ({ ...prev, template_id: defaultTemplate.id }));
          setBulkFormData(prev => ({ ...prev, template_id: defaultTemplate.id }));
        }
      }
    } catch (error: any) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadLocations = async () => {
    try {
      const response = await api.get(`/franchise/${franchiseSlug}/locations`);
      if (response.data.success) {
        const locationsData = response.data.data || [];
        setLocations(locationsData);
        // Set default location_id if available
        if (locationsData.length > 0) {
          setFormData(prev => ({ ...prev, location_id: locationsData[0].id }));
          setBulkFormData(prev => ({ ...prev, location_id: locationsData[0].id }));
        }
      }
    } catch (error: any) {
      console.error('Failed to load locations:', error);
    }
  };

  const loadFranchiseLogo = async () => {
    try {
      const response = await api.get(`/franchise/${franchiseSlug}/dashboard`);
      if (response.data.success) {
        const logo =
          response.data.data?.franchise?.logo_url ||
          response.data.data?.logo_url ||
          null;
        setFranchiseLogo(logo);
      }
    } catch {
      // non-critical — logo just won't show
    }
  };

  const handleCreate = async () => {
    try {
      setIsCreating(true);
      const response = await api.post(`/franchise/${franchiseSlug}/endpoints`, formData);
      if (response.data.success) {
        toast.success('Endpoint created successfully');
        setIsCreateOpen(false);
        loadEndpoints();
        resetForm();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create endpoint');
    } finally {
      setIsCreating(false);
    }
  };

  const handleBulkCreate = async () => {
    try {
      setIsBulkCreating(true);
      const response = await api.post(`/franchise/${franchiseSlug}/endpoints/bulk`, bulkFormData);
      if (response.data.success) {
        const count = response.data.data?.length || bulkFormData.count;
        toast.success(`${count} endpoints created successfully`);
        setIsBulkCreateOpen(false);
        loadEndpoints();
        resetBulkForm();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create endpoints');
    } finally {
      setIsBulkCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedEndpoint) return;
    try {
      setIsUpdating(true);
      const response = await api.put(`/franchise/${franchiseSlug}/endpoints/${selectedEndpoint.id}`, formData);
      if (response.data.success) {
        toast.success('Endpoint updated successfully');
        setIsEditOpen(false);
        loadEndpoints();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update endpoint');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEndpoint) return;
    try {
      setIsDeleting(true);
      const response = await api.delete(`/franchise/${franchiseSlug}/endpoints/${selectedEndpoint.id}`);
      if (response.data.success) {
        toast.success('Endpoint deleted successfully');
        setIsDeleteOpen(false);
        setSelectedEndpoint(null);
        loadEndpoints();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete endpoint');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShowQR = async (endpoint: MenuEndpoint) => {
    setSelectedEndpoint(endpoint);
    if (endpoint.qr_code_url) {
      setQrCodeData({
        url: endpoint.short_url || `${window.location.origin}/${franchiseSlug}/menu/${endpoint.identifier}`,
        short_url: endpoint.short_url || '',
        qr_code_url: endpoint.qr_code_url,
      });
      setIsQROpen(true);
    } else {
      try {
        const response = await api.get(`/franchise/${franchiseSlug}/endpoints/${endpoint.id}/qr`);
        if (response.data.success) {
          setQrCodeData(response.data.data);
          setIsQROpen(true);
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to generate QR code');
      }
    }
  };

  const handleRegenerateQR = async () => {
    if (!selectedEndpoint) return;
    try {
      setIsRegenerating(true);
      const response = await api.post(`/franchise/${franchiseSlug}/endpoints/${selectedEndpoint.id}/qr/regenerate`);
      if (response.data.success) {
        toast.success('QR code regenerated successfully');
        setQrCodeData(response.data.data);
        loadEndpoints();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to regenerate QR code');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDownloadQR = async () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${selectedEndpoint?.name || 'qr-code'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyURL = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard');
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const openEditDialog = (endpoint: MenuEndpoint) => {
    setSelectedEndpoint(endpoint);
    setFormData({
      name: endpoint.name,
      type: endpoint.type,
      identifier: endpoint.identifier,
      description: endpoint.description || '',
      template_id: endpoint.template_id,
      location_id: endpoint.location_id,
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (endpoint: MenuEndpoint) => {
    setSelectedEndpoint(endpoint);
    setIsDeleteOpen(true);
  };

  const resetForm = () => {
    const defaultTemplate = templates.find(t => (t as any).is_default) || templates[0];
    const defaultLocation = locations[0];
    setFormData({
      name: '',
      type: 'table',
      identifier: '',
      description: '',
      template_id: defaultTemplate?.id,
      location_id: defaultLocation?.id,
    });
  };

  const resetBulkForm = () => {
    const defaultTemplate = templates.find(t => (t as any).is_default) || templates[0];
    const defaultLocation = locations[0];
    setBulkFormData({
      type: 'table',
      prefix: 'Table',
      start: 1,
      count: 10,
      template_id: defaultTemplate?.id,
      location_id: defaultLocation?.id,
    });
  };

  const filteredEndpoints = endpoints.filter(endpoint =>
    endpoint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    endpoint.identifier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeIcon = (type: EndpointType) => {
    const typeConfig = endpointTypes.find(t => t.value === type);
    return typeConfig?.icon || TableProperties;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Tables & QR Codes</h1>
          <p className="text-neutral-600">Manage your dining areas and QR code endpoints</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsBulkCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Bulk Create
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Endpoint
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            placeholder="Search endpoints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm pl-10"
          />
        </div>
        <Tabs value={selectedType} onValueChange={setSelectedType}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="table">Tables</TabsTrigger>
            <TabsTrigger value="room">Rooms</TabsTrigger>
            <TabsTrigger value="area">Areas</TabsTrigger>
            <TabsTrigger value="branch">Branches</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Endpoints Grid */}
      {filteredEndpoints.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <TableProperties className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900">
              {searchQuery ? 'No endpoints found' : 'No endpoints yet'}
            </h3>
            <p className="text-neutral-600 mt-1">
              {searchQuery ? 'Try a different search term' : 'Create your first table or endpoint'}
            </p>
            {!searchQuery && (
              <Button className="mt-6" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Endpoint
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredEndpoints.map((endpoint) => {
              const Icon = getTypeIcon(endpoint.type);
              return (
                <motion.div
                  key={endpoint.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-50 rounded-lg">
                            <Icon className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{endpoint.name}</CardTitle>
                            <CardDescription className="mt-1">
                              {endpoint.identifier}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant={endpoint.is_active ? 'default' : 'secondary'}>
                          {endpoint.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {endpoint.description && (
                        <p className="text-sm text-neutral-600 mb-4">{endpoint.description}</p>
                      )}
                      <div className="flex items-center justify-between text-sm text-neutral-600 mb-4">
                        <span>{endpoint.scan_count} scans</span>
                        {endpoint.last_scanned_at && (
                          <span>Last: {new Date(endpoint.last_scanned_at).toLocaleDateString()}</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleShowQR(endpoint)}
                        >
                          <QrCode className="h-3 w-3 mr-1" />
                          QR Code
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(endpoint)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(endpoint)}
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Endpoint</DialogTitle>
            <DialogDescription>
              Add a new table, room, or endpoint for your menu
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <select
                className="w-full mt-1 px-3 py-2 border rounded-md"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as EndpointType })}
              >
                {endpointTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Branch/Location</Label>
              <select
                className="w-full mt-1 px-3 py-2 border rounded-md"
                value={formData.location_id || ''}
                onChange={(e) => setFormData({ ...formData, location_id: e.target.value ? Number(e.target.value) : undefined })}
              >
                {locations.length === 0 && <option value="">Loading locations...</option>}
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.branch_name || location.name}{location.branch_code ? ` (${location.branch_code})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Menu Template</Label>
              <select
                className="w-full mt-1 px-3 py-2 border rounded-md"
                value={formData.template_id || ''}
                onChange={(e) => setFormData({ ...formData, template_id: e.target.value ? Number(e.target.value) : undefined })}
              >
                <option value="">Use Default Menu</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}{template.location ? ` (${template.location.name})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Name</Label>
              <Input
                placeholder="e.g., Table 1, Room A"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Identifier</Label>
              <Input
                placeholder="e.g., T1, ROOM-A"
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
              />
            </div>
            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Additional details"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!formData.name || !formData.identifier || isCreating}>
              {isCreating ? 'Creating...' : 'Create Endpoint'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Endpoint</DialogTitle>
            <DialogDescription>
              Update endpoint details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <select
                className="w-full mt-1 px-3 py-2 border rounded-md"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as EndpointType })}
              >
                {endpointTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Branch/Location</Label>
              <select
                className="w-full mt-1 px-3 py-2 border rounded-md"
                value={formData.location_id || ''}
                onChange={(e) => setFormData({ ...formData, location_id: e.target.value ? Number(e.target.value) : undefined })}
              >
                {locations.length === 0 && <option value="">Loading locations...</option>}
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.branch_name || location.name}{location.branch_code ? ` (${location.branch_code})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Menu Template</Label>
              <select
                className="w-full mt-1 px-3 py-2 border rounded-md"
                value={formData.template_id || ''}
                onChange={(e) => setFormData({ ...formData, template_id: e.target.value ? Number(e.target.value) : undefined })}
              >
                <option value="">Use Default Menu</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}{template.location ? ` (${template.location.name})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Identifier</Label>
              <Input
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
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
              Create multiple endpoints at once
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <select
                className="w-full mt-1 px-3 py-2 border rounded-md"
                value={bulkFormData.type}
                onChange={(e) => setBulkFormData({ ...bulkFormData, type: e.target.value as EndpointType })}
              >
                {endpointTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Branch/Location</Label>
              <select
                className="w-full mt-1 px-3 py-2 border rounded-md"
                value={bulkFormData.location_id || ''}
                onChange={(e) => setBulkFormData({ ...bulkFormData, location_id: e.target.value ? Number(e.target.value) : undefined })}
              >
                {locations.length === 0 && <option value="">Loading locations...</option>}
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.branch_name || location.name}{location.branch_code ? ` (${location.branch_code})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Menu Template</Label>
              <select
                className="w-full mt-1 px-3 py-2 border rounded-md"
                value={bulkFormData.template_id || ''}
                onChange={(e) => setBulkFormData({ ...bulkFormData, template_id: e.target.value ? Number(e.target.value) : undefined })}
              >
                <option value="">Use Default Menu</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}{template.location ? ` (${template.location.name})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Prefix</Label>
              <Input
                placeholder="e.g., Table, Room"
                value={bulkFormData.prefix}
                onChange={(e) => setBulkFormData({ ...bulkFormData, prefix: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Number</Label>
                <Input
                  type="number"
                  value={bulkFormData.start}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, start: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label>Count</Label>
                <Input
                  type="number"
                  value={bulkFormData.count}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, count: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="bg-neutral-50 p-3 rounded-md">
              <p className="text-sm text-neutral-600">
                Preview: {bulkFormData.prefix} {bulkFormData.start} to {bulkFormData.prefix} {bulkFormData.start + bulkFormData.count - 1}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkCreateOpen(false)} disabled={isBulkCreating}>
              Cancel
            </Button>
            <Button onClick={handleBulkCreate} disabled={isBulkCreating}>
              {isBulkCreating ? 'Creating...' : `Create ${bulkFormData.count} Endpoints`}
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
              Are you sure you want to delete "{selectedEndpoint?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={isQROpen} onOpenChange={setIsQROpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code - {selectedEndpoint?.name}</DialogTitle>
            <DialogDescription>
              Scan this QR code to access the menu
            </DialogDescription>
          </DialogHeader>
          {qrCodeData && (
            <div className="space-y-4">
              <div className="flex justify-center p-6 bg-white rounded-lg border">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    className="w-64 h-64"
                  />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-gray-300" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={qrCodeData.url}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyURL(qrCodeData.url)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                {qrCodeData.short_url && (
                  <div className="flex items-center gap-2">
                    <Input
                      value={qrCodeData.short_url}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopyURL(qrCodeData.short_url)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleDownloadQR}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleRegenerateQR} disabled={isRegenerating}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
                  {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                </Button>
              </div>
            </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
