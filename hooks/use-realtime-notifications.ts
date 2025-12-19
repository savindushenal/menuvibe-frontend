'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import Pusher from 'pusher-js';
import Echo from 'laravel-echo';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<'pusher'> | null;
  }
}

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  data: Record<string, any>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

interface TicketUpdate {
  ticket: {
    id: number;
    ticket_number: string;
    subject: string;
    status: string;
    priority: string;
    assigned_to: number | null;
    assignedTo?: {
      id: number;
      name: string;
      email: string;
    };
  };
  action: string;
  actor: {
    id: number;
    name: string;
  };
}

interface StaffStatusChange {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    is_online: boolean;
    active_tickets_count: number;
  };
  status: 'online' | 'offline';
}

interface UseRealTimeNotificationsOptions {
  onNotification?: (notification: Notification) => void;
  onTicketUpdate?: (update: TicketUpdate) => void;
  onStaffStatusChange?: (change: StaffStatusChange) => void;
  showToasts?: boolean;
  autoSubscribe?: boolean;
}

export function useRealTimeNotifications(options: UseRealTimeNotificationsOptions = {}) {
  const {
    onNotification,
    onTicketUpdate,
    onStaffStatusChange,
    showToasts = true,
    autoSubscribe = true,
  } = options;

  const { user, token } = useAuth();
  const echoRef = useRef<Echo<'pusher'> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Initialize Echo/Pusher
  const initializeEcho = useCallback(() => {
    if (typeof window === 'undefined' || !token || !user) {
      return null;
    }

    // Return existing instance if available
    if (window.Echo) {
      return window.Echo;
    }

    // Make Pusher available globally for Echo
    window.Pusher = Pusher;

    try {
      const echo = new Echo({
        broadcaster: 'pusher',
        key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY || '',
        cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || 'mt1',
        forceTLS: true,
        encrypted: true,
        authEndpoint: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/broadcasting/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      });

      window.Echo = echo;
      return echo;
    } catch (error) {
      console.error('Failed to initialize Echo:', error);
      setConnectionError('Failed to initialize real-time connection');
      return null;
    }
  }, [token, user]);

  // Subscribe to user's notification channel
  const subscribeToNotifications = useCallback(() => {
    const echo = echoRef.current;
    if (!echo || !user) return;

    echo.private(`admin.notifications.${user.id}`)
      .listen('.notification.new', (data: { notification: Notification }) => {
        const notification = data.notification;
        
        if (onNotification) {
          onNotification(notification);
        }

        if (showToasts) {
          // Show toast based on notification type
          const toastOptions: Parameters<typeof toast>[1] = {
            description: notification.message,
            action: notification.link ? {
              label: 'View',
              onClick: () => window.location.href = notification.link!,
            } : undefined,
          };

          switch (notification.type) {
            case 'ticket_urgent':
              toast.error(notification.title, toastOptions);
              break;
            case 'ticket_assigned':
              toast.info(notification.title, toastOptions);
              break;
            case 'ticket_new':
              toast.success(notification.title, toastOptions);
              break;
            default:
              toast(notification.title, toastOptions);
          }
        }
      })
      .error((error: any) => {
        console.error('Notification channel error:', error);
        setConnectionError('Failed to subscribe to notifications');
      });
  }, [user, onNotification, showToasts]);

  // Subscribe to ticket updates channel
  const subscribeToTicketUpdates = useCallback(() => {
    const echo = echoRef.current;
    if (!echo) return;

    echo.private('admin.tickets')
      .listen('.ticket.updated', (data: TicketUpdate) => {
        if (onTicketUpdate) {
          onTicketUpdate(data);
        }

        if (showToasts) {
          const { ticket, action, actor } = data;
          let message = '';
          
          switch (action) {
            case 'assigned':
              message = `${actor.name} assigned ticket #${ticket.ticket_number}`;
              break;
            case 'auto_assigned':
              message = `Ticket #${ticket.ticket_number} auto-assigned to ${ticket.assignedTo?.name}`;
              break;
            case 'self_assigned':
              message = `${actor.name} took ticket #${ticket.ticket_number}`;
              break;
            case 'status_changed':
              message = `Ticket #${ticket.ticket_number} status changed to ${ticket.status}`;
              break;
            case 'priority_changed':
              message = `Ticket #${ticket.ticket_number} priority changed to ${ticket.priority}`;
              break;
            case 'new_message':
              message = `${actor.name} replied to ticket #${ticket.ticket_number}`;
              break;
            default:
              message = `Ticket #${ticket.ticket_number} was updated`;
          }

          toast.info('Ticket Update', { description: message });
        }
      })
      .error((error: any) => {
        console.error('Ticket channel error:', error);
      });
  }, [onTicketUpdate, showToasts]);

  // Subscribe to staff status changes
  const subscribeToStaffStatus = useCallback(() => {
    const echo = echoRef.current;
    if (!echo) return;

    echo.private('admin.staff-status')
      .listen('.staff.status.changed', (data: StaffStatusChange) => {
        if (onStaffStatusChange) {
          onStaffStatusChange(data);
        }

        if (showToasts && data.user.id !== user?.id) {
          toast.info(
            data.status === 'online' ? '🟢 Staff Online' : '🔴 Staff Offline',
            { description: `${data.user.name} is now ${data.status}` }
          );
        }
      })
      .error((error: any) => {
        console.error('Staff status channel error:', error);
      });
  }, [user, onStaffStatusChange, showToasts]);

  // Connect and subscribe
  useEffect(() => {
    if (!autoSubscribe || !token || !user?.canHandleSupportTickets) {
      return;
    }

    const echo = initializeEcho();
    if (!echo) return;

    echoRef.current = echo;

    // Check connection state
    const pusher = echo.connector.pusher;
    
    pusher.connection.bind('connected', () => {
      setIsConnected(true);
      setConnectionError(null);
      console.log('Connected to Pusher');
    });

    pusher.connection.bind('disconnected', () => {
      setIsConnected(false);
      console.log('Disconnected from Pusher');
    });

    pusher.connection.bind('error', (error: any) => {
      setConnectionError('Connection error');
      console.error('Pusher connection error:', error);
    });

    // Subscribe to channels
    subscribeToNotifications();
    subscribeToTicketUpdates();
    subscribeToStaffStatus();

    return () => {
      // Cleanup subscriptions
      if (echo && user) {
        echo.leave(`admin.notifications.${user.id}`);
        echo.leave('admin.tickets');
        echo.leave('admin.staff-status');
      }
    };
  }, [
    autoSubscribe,
    token,
    user,
    initializeEcho,
    subscribeToNotifications,
    subscribeToTicketUpdates,
    subscribeToStaffStatus,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.Echo) {
        window.Echo.disconnect();
        window.Echo = null;
      }
    };
  }, []);

  // Manual methods for controlling subscriptions
  const disconnect = useCallback(() => {
    if (echoRef.current) {
      echoRef.current.disconnect();
      echoRef.current = null;
      window.Echo = null;
      setIsConnected(false);
    }
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    const echo = initializeEcho();
    if (echo) {
      echoRef.current = echo;
      subscribeToNotifications();
      subscribeToTicketUpdates();
      subscribeToStaffStatus();
    }
  }, [disconnect, initializeEcho, subscribeToNotifications, subscribeToTicketUpdates, subscribeToStaffStatus]);

  return {
    isConnected,
    connectionError,
    disconnect,
    reconnect,
  };
}

// Simplified hook for just notifications
export function useNotificationChannel(onNotification: (notification: Notification) => void) {
  return useRealTimeNotifications({
    onNotification,
    showToasts: false,
    autoSubscribe: true,
  });
}

// Simplified hook for ticket updates
export function useTicketUpdates(onUpdate: (update: TicketUpdate) => void) {
  return useRealTimeNotifications({
    onTicketUpdate: onUpdate,
    showToasts: false,
    autoSubscribe: true,
  });
}

// Simplified hook for staff status
export function useStaffStatus(onChange: (change: StaffStatusChange) => void) {
  return useRealTimeNotifications({
    onStaffStatusChange: onChange,
    showToasts: false,
    autoSubscribe: true,
  });
}
