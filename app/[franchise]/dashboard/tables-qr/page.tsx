'use client';

import { useState, useEffect } from 'react';
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

  // Dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const [isBulkCreateOpen, setIsBulkCreateOpen] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<MenuEndpoint | null>(null);
  const [qrCodeData, setQrCodeData] = useState<{ url: string; short_url: string; qr_code_url: string } | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    type: EndpointType;
    identifier: string;
    description: string;
  }>({
    name: '',
    type: 'table',
    identifier: '',
    description: '',
  });

  const [bulkFormData, setBulkFormData] = useState<{
    type: EndpointType;
    prefix: string;
    start: number;
    count: number;
  }>({
    type: 'table',
    prefix: 'Table',
    start: 1,
    count: 10,
  });

  useEffect(() => {
    loadEndpoints();
  }, [franchiseSlug, selectedType]);

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

  const handleCreate = async () => {
    try {
      const response = await api.post(`/franchise/${franchiseSlug}/endpoints`, formData);
      if (response.data.success) {
        toast.success('Endpoint created successfully');
        setIsCreateOpen(false);
        loadEndpoints();
        resetForm();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create endpoint');
    }
  };

  const handleBulkCreate = async () => {
    try {
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
    }
  };

  const handleUpdate = async () => {
    if (!selectedEndpoint) return;
    try {
      const response = await api.put(`/franchise/${franchiseSlug}/endpoints/${selectedEndpoint.id}`, formData);
      if (response.data.success) {
        toast.success('Endpoint updated successfully');
        setIsEditOpen(false);
        loadEndpoints();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update endpoint');
    }
  };

  const handleDelete = async () => {
    if (!selectedEndpoint) return;
    try {
      const response = await api.delete(`/franchise/${franchiseSlug}/endpoints/${selectedEndpoint.id}`);
      if (response.data.success) {
        toast.success('Endpoint deleted successfully');
        setIsDeleteOpen(false);
        setSelectedEndpoint(null);
        loadEndpoints();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete endpoint');
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
      const response = await api.post(`/franchise/${franchiseSlug}/endpoints/${selectedEndpoint.id}/qr/regenerate`);
      if (response.data.success) {
        toast.success('QR code regenerated successfully');
        setQrCodeData(response.data.data);
        loadEndpoints();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to regenerate QR code');
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeData?.qr_code_url) return;
    const link = document.createElement('a');
    link.href = qrCodeData.qr_code_url;
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
    });
  };

  const resetBulkForm = () => {
    setBulkFormData({
      type: 'table',
      prefix: 'Table',
      start: 1,
      count: 10,
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
        <div className="flex-1">
          <Input
            placeholder="Search endpoints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
            icon={Search}
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
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!formData.name || !formData.identifier}>
              Create Endpoint
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
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>
              Save Changes
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
            <Button variant="outline" onClick={() => setIsBulkCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkCreate}>
              Create {bulkFormData.count} Endpoints
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
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
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
                <img
                  src={qrCodeData.qr_code_url}
                  alt="QR Code"
                  className="w-64 h-64"
                />
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
                <Button variant="outline" className="flex-1" onClick={handleRegenerateQR}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
