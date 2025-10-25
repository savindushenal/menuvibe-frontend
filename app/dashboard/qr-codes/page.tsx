'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Download, Eye, Trash2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { QRCode } from '@/lib/types';
import { QRCodeSVG } from 'qrcode.react';

const mockQRCodes: QRCode[] = [
  {
    id: '1',
    name: 'Main Menu',
    restaurant_id: '1',
    url: 'https://menuvibe.com/menu/restaurant-1',
    scans: 1234,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Table 5',
    restaurant_id: '1',
    url: 'https://menuvibe.com/menu/restaurant-1?table=5',
    scans: 87,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function QRCodesPage() {
  const [qrCodes] = useState<QRCode[]>(mockQRCodes);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newQR, setNewQR] = useState({ name: '', url: '' });
  const { toast } = useToast();

  const handleCreate = () => {
    toast({
      title: 'QR Code created',
      description: `${newQR.name} has been created successfully.`,
    });
    setIsCreateOpen(false);
    setNewQR({ name: '', url: '' });
  };

  const handleDownload = (qrCode: QRCode) => {
    const svg = document.getElementById(`qr-${qrCode.id}`);
    if (svg && svg instanceof SVGElement) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      canvas.width = 180;
      canvas.height = 180;

      img.onload = () => {
        ctx?.drawImage(img, 0, 0);
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${qrCode.name.replace(/\s+/g, '-')}-qr-code.png`;
        link.href = url;
        link.click();
        toast({
          title: 'QR Code downloaded',
          description: 'Your QR code has been saved.',
        });
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: 'URL copied',
      description: 'The URL has been copied to your clipboard.',
    });
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">QR Codes</h1>
          <p className="text-neutral-600 mt-1">
            Generate and manage QR codes for your menu
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30">
              <Plus className="w-4 h-4 mr-2" />
              Create QR Code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New QR Code</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="qr-name">QR Code Name</Label>
                <Input
                  id="qr-name"
                  placeholder="e.g., Main Menu"
                  value={newQR.name}
                  onChange={(e) => setNewQR({ ...newQR, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qr-url">Menu URL</Label>
                <Input
                  id="qr-url"
                  placeholder="https://..."
                  value={newQR.url}
                  onChange={(e) => setNewQR({ ...newQR, url: e.target.value })}
                />
              </div>
              {newQR.url && (
                <div className="p-4 bg-neutral-50 rounded-lg flex justify-center">
                  <QRCodeSVG value={newQR.url} size={200} level="H" />
                </div>
              )}
              <Button
                onClick={handleCreate}
                className="w-full"
                disabled={!newQR.name || !newQR.url}
              >
                Generate QR Code
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {qrCodes.map((qrCode, index) => (
          <motion.div
            key={qrCode.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="border-neutral-200 hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-neutral-900">
                  {qrCode.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-6 bg-white rounded-lg border-2 border-neutral-200 flex justify-center">
                  <QRCodeSVG
                    id={`qr-${qrCode.id}`}
                    value={qrCode.url}
                    size={180}
                    level="H"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600">Total Scans</span>
                    <span className="font-semibold text-emerald-600">
                      {qrCode.scans.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={qrCode.url}
                      readOnly
                      className="text-xs bg-neutral-50"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(qrCode.url)}
                      className="flex-shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(qrCode)}
                    className="border-neutral-300"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-neutral-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-neutral-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-900">
            Scan Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {qrCodes.map((qrCode) => (
              <div
                key={qrCode.id}
                className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-900">{qrCode.name}</p>
                    <p className="text-sm text-neutral-500">
                      Created {new Date(qrCode.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-600">
                    {qrCode.scans.toLocaleString()}
                  </p>
                  <p className="text-xs text-neutral-500">total scans</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
