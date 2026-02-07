'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const paymentStatus = searchParams.get('status');

    if (!sessionId) {
      setStatus('failed');
      setError('Invalid payment callback - missing session ID');
      return;
    }

    // Process the payment callback
    processPaymentCallback(sessionId, paymentStatus);
  }, [searchParams]);

  const processPaymentCallback = async (sessionId: string, paymentStatus: string | null) => {
    try {
      // Get all query parameters
      const orderId = searchParams.get('order_id');
      const amount = searchParams.get('amount');
      const currency = searchParams.get('currency');
      
      // Call backend to verify and activate subscription
      const result = await apiClient.get(`/subscriptions/payment-callback?status=${paymentStatus || 'success'}&session_id=${sessionId}&order_id=${orderId}&amount=${amount}&currency=${currency}`);
      
      // API response structure: { success, message, data: { ...actual response } }
      const response = result.data as any;

      if (response.success) {
        setStatus('success');
        setPaymentDetails(response);
        
        toast({
          title: 'Payment Successful!',
          description: `Your subscription to ${response.subscription?.plan || 'the new plan'} has been activated.`,
        });

        // Redirect to subscription page after 3 seconds
        setTimeout(() => {
          router.push('/dashboard/subscription');
        }, 3000);
      } else {
        setStatus('failed');
        setError(response.message || 'Payment verification failed');
        
        toast({
          title: 'Payment Failed',
          description: response.message || 'Failed to activate subscription',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Payment callback error:', error);
      setStatus('failed');
      setError(error.message || 'An error occurred while processing your payment');
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to process payment',
        variant: 'destructive',
      });
    }
  };

  const handleReturnToSubscriptions = () => {
    router.push('/dashboard/subscription');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              {status === 'processing' && 'Processing Payment...'}
              {status === 'success' && 'Payment Successful!'}
              {status === 'failed' && 'Payment Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Icon */}
            <div className="flex justify-center">
              {status === 'processing' && (
                <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
              )}
              {status === 'success' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                >
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                </motion.div>
              )}
              {status === 'failed' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                >
                  <XCircle className="h-16 w-16 text-red-500" />
                </motion.div>
              )}
            </div>

            {/* Status Message */}
            <div className="text-center space-y-2">
              {status === 'processing' && (
                <>
                  <p className="text-lg font-medium">Verifying your payment...</p>
                  <p className="text-sm text-gray-500">Please wait while we confirm your subscription</p>
                </>
              )}
              
              {status === 'success' && paymentDetails && (
                <>
                  <p className="text-lg font-medium text-green-600">
                    Subscription Activated!
                  </p>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 space-y-2 text-left">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Plan:</span>
                      <span className="font-medium">{paymentDetails.subscription?.plan}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span className="font-medium capitalize">{paymentDetails.subscription?.status}</span>
                    </div>
                    {paymentDetails.payment && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Amount Paid:</span>
                          <span className="font-medium">
                            {paymentDetails.payment.currency} {(paymentDetails.payment.amount / 100).toFixed(2)}
                          </span>
                        </div>
                        {paymentDetails.payment.setup_fee_paid && (
                          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                            <AlertCircle className="h-4 w-4" />
                            <span>Setup fee included</span>
                          </div>
                        )}
                        {paymentDetails.payment.card_saved && (
                          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Card saved for future payments</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 pt-2">
                    Redirecting to subscription page in 3 seconds...
                  </p>
                </>
              )}
              
              {status === 'failed' && (
                <>
                  <p className="text-lg font-medium text-red-600">
                    Payment Could Not Be Completed
                  </p>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {error || 'Your payment was not successful. Please try again.'}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            {status !== 'processing' && (
              <div className="flex justify-center pt-4">
                <Button onClick={handleReturnToSubscriptions}>
                  Return to Subscriptions
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
