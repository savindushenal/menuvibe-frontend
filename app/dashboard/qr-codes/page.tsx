'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Plus, Download, Trash2, Eye, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from '@/contexts/location-context';
import { useSubscription } from '@/contexts/subscription-context';
import { apiClient } from '@/lib/api';

interface QRCodeType {
  id: number;
  location_id: number;
  menu_id: number | null;
  name: string;
  table_number: string | null;
  qr_url: string;
  qr_image: string;
  scan_count: number;
  menu_name?: string;
  created_at: string;
}

interface Menu {
  id: number;
  name: string;
}

export default function QRCodesPage() {
  const [qrCodes, setQrCodes] = useState<QRCodeType[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedQR, setSelectedQR] = useState<QRCodeType | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const { toast } = useToast();
  const { currentLocation } = useLocation();
  const { subscription, loading: subLoading } = useSubscription();

  const [formData, setFormData] = useState({
    name: '',
    menu_id: '',
    table_number: '',
  });

  // Determine plan type
  const planSlug = subscription?.plan?.slug || 'free';
  const isFree = planSlug === 'free';
  const isPro = planSlug === 'pro';
  const isEnterprise = planSlug === 'enterprise';
  const isPremium = isPro || isEnterprise; // Pro or Enterprise have premium features

  useEffect(() => {
    loadQRCodes();
    loadMenus();
  }, [currentLocation]);

  const loadQRCodes = async () => {
    try {
      setLoading(true);
      const locationId = currentLocation?.id ? parseInt(currentLocation.id) : undefined;
      const response = await apiClient.getQRCodes(locationId);
      if (response.success) {
        setQrCodes(response.data.qr_codes || []);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load QR codes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMenus = async () => {
    try {
      const response = await apiClient.getMenus(currentLocation?.id.toString());
      if (response.success) {
        setMenus(response.data.menus || []);
      }
    } catch (error) {
      console.error('Error loading menus:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a name for the QR code',
        variant: 'destructive',
      });
      return;
    }

    try {
      const data: any = { name: formData.name.trim() };
      if (currentLocation?.id) data.location_id = parseInt(currentLocation.id);
      if (formData.menu_id) data.menu_id = parseInt(formData.menu_id);
      if (formData.table_number) data.table_number = formData.table_number.trim();

      const response = await apiClient.createQRCode(data);
      if (response.success) {
        toast({ title: 'Success', description: 'QR code created successfully' });
        setIsCreateOpen(false);
        setFormData({ name: '', menu_id: '', table_number: '' });
        loadQRCodes();
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to create QR code', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this QR code?')) return;
    try {
      const response = await apiClient.deleteQRCode(id);
      if (response.success) {
        toast({ title: 'Success', description: 'QR code deleted successfully' });
        loadQRCodes();
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete QR code', variant: 'destructive' });
    }
  };

  const handleDownload = (qrCode: QRCodeType) => {
    const link = document.createElement('a');
    link.href = qrCode.qr_image;
    link.download = `${qrCode.name.replace(/\s+/g, '-')}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || subLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading QR codes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-neutral-900">QR Codes</h1>
            {subscription?.plan && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                isEnterprise ? 'bg-purple-100 text-purple-700' :
                isPro ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {subscription.plan.name}
              </span>
            )}
          </div>
          <p className="text-neutral-600 mt-1">
            {isFree && 'Generate 1 general QR code • '}
            {isPro && 'Unlimited QR codes with menu & table features • '}
            {isEnterprise && 'Unlimited QR codes with advanced features • '}
            {isPremium ? `${qrCodes.length} QR code${qrCodes.length !== 1 ? 's' : ''} created` : 'Upgrade for more features'}
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-500 hover:bg-emerald-600">
              <Plus className="w-4 h-4 mr-2" />
              Create QR Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create QR Code</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              {isFree && qrCodes.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-900">Free Plan Limit Reached</p>
                    <p className="text-amber-700 mt-1">You already have 1 QR code. Upgrade to Pro or Enterprise for unlimited QR codes with menu and table-specific features.</p>
                  </div>
                </div>
              )}
              {isFree && qrCodes.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Free Plan</p>
                    <p className="text-blue-700 mt-1">You can create 1 general QR code. Upgrade for unlimited QR codes with menu and table customization.</p>
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="name">QR Code Name *</Label>
                <Input id="name" placeholder="e.g., Main Menu QR" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="menu">Menu (Optional)</Label>
                <select id="menu" className="w-full border border-gray-300 rounded-md p-2" value={formData.menu_id} onChange={(e) => setFormData({ ...formData, menu_id: e.target.value })} disabled={isFree}>
                  <option value="">All Menus</option>
                  {menus.map((menu) => (<option key={menu.id} value={menu.id}>{menu.name}</option>))}
                </select>
                {isFree && <p className="text-xs text-amber-600 mt-1"><Sparkles className="w-3 h-3 inline mr-1" />Upgrade to Pro or Enterprise to link specific menus</p>}
              </div>
              <div>
                <Label htmlFor="table">Table Number (Optional)</Label>
                <Input id="table" placeholder="e.g., Table 5" value={formData.table_number} onChange={(e) => setFormData({ ...formData, table_number: e.target.value })} disabled={isFree} />
                {isFree && <p className="text-xs text-amber-600 mt-1"><Sparkles className="w-3 h-3 inline mr-1" />Upgrade to Pro or Enterprise for table-specific QR codes</p>}
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={isFree && qrCodes.length > 0}>Generate QR Code</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {qrCodes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <QrCode className="w-16 h-16 text-neutral-300 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No QR codes yet</h3>
            <p className="text-neutral-600 text-center mb-6 max-w-md">Create your first QR code to let customers access your menu digitally</p>
            <Button onClick={() => setIsCreateOpen(true)} className="bg-emerald-500 hover:bg-emerald-600">
              <Plus className="w-4 h-4 mr-2" />Create First QR Code
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {qrCodes.map((qrCode) => (
            <motion.div key={qrCode.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{qrCode.name}</CardTitle>
                  <CardDescription className="mt-1">{qrCode.menu_name ? `Menu: ${qrCode.menu_name}` : 'All Menus'}{qrCode.table_number && `  Table: ${qrCode.table_number}`}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white border-2 border-neutral-200 rounded-lg p-4 flex items-center justify-center">
                    <img src={qrCode.qr_image} alt={qrCode.name} className="w-48 h-48" />
                  </div>
                  <div className="flex items-center justify-between text-sm text-neutral-600">
                    <span>Scans: {qrCode.scan_count}</span>
                    <span className="text-xs">{new Date(qrCode.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setSelectedQR(qrCode); setIsViewOpen(true); }} className="flex-1">
                      <Eye className="w-4 h-4 mr-1" />View
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(qrCode)} className="flex-1">
                      <Download className="w-4 h-4 mr-1" />Download
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(qrCode.id)} className="text-red-600 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selectedQR?.name}</DialogTitle></DialogHeader>
          {selectedQR && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-center bg-white border-2 border-neutral-200 rounded-lg p-8">
                <img src={selectedQR.qr_image} alt={selectedQR.name} className="max-w-sm w-full" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">URL:</span>
                  <span className="font-mono text-xs break-all max-w-[60%] text-right">{selectedQR.qr_url}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Scans:</span>
                  <span className="font-semibold">{selectedQR.scan_count}</span>
                </div>
                {selectedQR.menu_name && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Menu:</span>
                    <span>{selectedQR.menu_name}</span>
                  </div>
                )}
                {selectedQR.table_number && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Table:</span>
                    <span>{selectedQR.table_number}</span>
                  </div>
                )}
              </div>
              <Button onClick={() => handleDownload(selectedQR)} className="w-full">
                <Download className="w-4 h-4 mr-2" />Download QR Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
