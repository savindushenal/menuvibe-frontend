'use client';

import { useState } from 'react';
import { Download, Maximize2, X, QrCode as QrIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface QRCodeDynamicProps {
  code: string;
  endpointName: string;
  locationName?: string;
  businessColor?: string;
}

/**
 * Dynamic QR Code Display Component
 * 
 * No QR images stored in database!
 * QR codes are generated on-demand by the API:
 * - Display: GET /api/qr/{code} (SVG, cached 1 hour)
 * - Download: GET /api/qr/{code}/download?format=png&size=512
 * 
 * Benefits:
 * - Zero storage cost
 * - Always up-to-date with current branding
 * - Scalable for thousands of QR codes
 * - Can change colors without regenerating
 */
export function QRCodeDynamic({ 
  code, 
  endpointName, 
  locationName,
  businessColor = '#3B82F6'
}: QRCodeDynamicProps) {
  const [showModal, setShowModal] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  
  // SVG endpoint - displayed in UI (no storage!)
  const qrSvgUrl = `${apiUrl}/qr/${code}`;
  
  // Public menu URL
  const menuUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/m/${code}`;
  
  /**
   * Download QR code in specified format
   * Downloads are generated on-demand, not stored
   */
  const downloadQR = async (format: 'png' | 'jpg', size: number = 1024) => {
    setDownloading(`${format}-${size}`);
    
    try {
      const downloadUrl = `${apiUrl}/qr/${code}/download?format=${format}&size=${size}`;
      
      // Open in new tab to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `qr-${endpointName}-${code}.${format}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(null);
    }
  };
  
  /**
   * Copy menu URL to clipboard
   */
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      // You can add a toast notification here
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };
  
  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <QrIcon className="w-5 h-5" style={{ color: businessColor }} />
                {endpointName}
              </CardTitle>
              {locationName && (
                <CardDescription>{locationName}</CardDescription>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowModal(true)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* QR Code Display - Dynamic SVG from API */}
          <div className="relative group bg-white p-4 rounded-lg border-2 flex items-center justify-center">
            <img 
              src={qrSvgUrl} 
              alt={`QR Code for ${endpointName}`}
              className="w-48 h-48 cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setShowModal(true)}
              loading="lazy"
            />
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowModal(true)}
              >
                <Maximize2 className="w-4 h-4 mr-2" />
                View Fullscreen
              </Button>
            </div>
          </div>
          
          {/* Menu URL */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Menu URL</p>
            <div className="flex items-center gap-2">
              <code className="text-sm flex-1 truncate">{menuUrl}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyUrl}
              >
                Copy
              </Button>
            </div>
          </div>
          
          {/* Download Options */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Download QR Code</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadQR('png', 512)}
                disabled={downloading === 'png-512'}
                className="justify-start"
              >
                {downloading === 'png-512' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                PNG (512px)
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadQR('png', 1024)}
                disabled={downloading === 'png-1024'}
                className="justify-start"
              >
                {downloading === 'png-1024' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                PNG (1024px)
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadQR('png', 2048)}
                disabled={downloading === 'png-2048'}
                className="justify-start"
              >
                {downloading === 'png-2048' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                PNG (2048px)
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadQR('jpg', 1024)}
                disabled={downloading === 'jpg-1024'}
                className="justify-start"
              >
                {downloading === 'jpg-1024' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                JPG (1024px)
              </Button>
            </div>
          </div>
          
          {/* Info Badge */}
          <div className="p-2 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              ✨ QR code generated on-demand with your branding colors
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Fullscreen Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{endpointName}</DialogTitle>
            <DialogDescription>
              {locationName && <span>{locationName} • </span>}
              Code: {code}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Large QR Display */}
            <div className="bg-white p-8 rounded-lg border-2 flex items-center justify-center">
              <img 
                src={qrSvgUrl} 
                alt={`QR Code for ${endpointName}`}
                className="w-full max-w-md h-auto"
              />
            </div>
            
            {/* Download Options */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => {
                  downloadQR('png', 1024);
                  setShowModal(false);
                }}
                disabled={!!downloading}
              >
                <Download className="w-4 h-4 mr-2" />
                Download PNG (1024px)
              </Button>
              
              <Button
                onClick={() => {
                  downloadQR('png', 2048);
                  setShowModal(false);
                }}
                disabled={!!downloading}
              >
                <Download className="w-4 h-4 mr-2" />
                Download PNG (2048px)
              </Button>
            </div>
            
            {/* Menu URL */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-2">Share this menu link:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={menuUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm border rounded-lg bg-white"
                  onClick={(e) => e.currentTarget.select()}
                />
                <Button onClick={copyUrl}>
                  Copy
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
