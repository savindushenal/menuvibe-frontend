'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useRealTimeNotifications } from '@/hooks/use-realtime-notifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Ticket,
  Clock,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  User,
  UserPlus,
  Eye,
  Zap,
  Hand,
  RefreshCw,
  Loader2,
  RotateCcw,
  X,
  Send,
  Volume2,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useNotificationSound, getTicketActionSoundType } from '@/hooks/use-notification-sound';

interface SupportTicket {
  id: number;
  ticket_number: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  created_at: string;
  resolved_at: string | null;
  user: {
    id: number;
    name: string;
    email: string;
  };
  assigned_to: {
    id: number;
    name: string;
    email: string;
    role?: string;
  } | null;
  messages?: {
    id: number;
    message: string;
    is_internal: boolean;
    created_at: string;
    user: {
      id: number;
      name: string;
      role: string;
    };
  }[];
  views?: {
    id: number;
    viewed_at: string;
    user: {
      id: number;
      name: string;
      email: string;
      role: string;
    };
  }[];
  assignments?: {
    id: number;
    assignment_type: string;
    assigned_at: string;
    notes: string | null;
    assignee: {
      id: number;
      name: string;
      email: string;
    };
    assigner: {
      id: number;
      name: string;
      email: string;
    } | null;
  }[];
}

interface SupportStaff {
  id: number;
  name: string;
  email: string;
  role: string;
  is_online: boolean;
  last_seen_at: string | null;
  active_tickets_count: number;
}

interface TicketStats {
  by_status: {
    open: number;
    in_progress: number;
    waiting_on_customer: number;
    resolved: number;
    closed: number;
  };
  by_priority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  unassigned: number;
  my_tickets: number;
  average_resolution_time: number | null;
}

export default function AdminTicketsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { playSound } = useNotificationSound();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Check if current user is a support officer (can only self-assign)
  const isSupportOfficer = user?.role === 'support_officer';

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<{id: string; message: string; sending: boolean; failed: boolean}[]>([]);
  
  // Assignment states
  const [availableStaff, setAvailableStaff] = useState<SupportStaff[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState('');

  // Track if we need to refresh (set by real-time updates)
  const [needsRefresh, setNeedsRefresh] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);

      const response = await apiClient.getAdminTickets(params);
      if (response.success) {
        setTickets(response.data as SupportTicket[]);
        setMeta(response.meta);
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to load tickets',
        variant: 'destructive',
      });
    }
  }, [page, search, statusFilter, priorityFilter, toast]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.getAdminTicketStats();
      if (response.success) {
        setStats(response.data as TicketStats);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  const fetchTicketDetails = useCallback(async (id: number) => {
    try {
      const response = await apiClient.getAdminTicket(id);
      if (response.success) {
        setSelectedTicket(response.data as SupportTicket);
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to load ticket details',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Real-time updates - update tickets when any ticket changes
  const handleTicketUpdate = useCallback((update: any) => {
    console.log('handleTicketUpdate called with:', update);
    const { ticket, action, actor } = update;
    
    // Play sound for important updates (not from current user)
    if (actor?.id !== user?.id) {
      const soundType = getTicketActionSoundType(action, ticket.priority);
      playSound(soundType);
      
      const actorName = actor?.name || 'System';
      let toastMessage = '';
      
      switch (action) {
        case 'created':
          toastMessage = `New ticket #${ticket.ticket_number} created`;
          break;
        case 'assigned':
          toastMessage = `${actorName} assigned ticket #${ticket.ticket_number} to ${ticket.assignedTo?.name || 'someone'}`;
          break;
        case 'auto_assigned':
          toastMessage = `Ticket #${ticket.ticket_number} auto-assigned to ${ticket.assignedTo?.name || 'staff'}`;
          break;
        case 'self_assigned':
          toastMessage = `${actorName} took ticket #${ticket.ticket_number}`;
          break;
        case 'status_changed':
          toastMessage = `Ticket #${ticket.ticket_number} status changed to ${ticket.status}`;
          break;
        case 'new_message':
          toastMessage = `New message on ticket #${ticket.ticket_number}`;
          break;
      }
      
      if (toastMessage) {
        toast({
          title: 'Ticket Update',
          description: toastMessage,
        });
      }
    }
    
    // Update the ticket in our local state immediately for instant feedback
    setTickets(prevTickets => {
      const ticketIndex = prevTickets.findIndex(t => t.id === ticket.id);
      
      if (action === 'created') {
        // New ticket - trigger a refresh
        setNeedsRefresh(true);
        return prevTickets;
      }
      
      if (ticketIndex !== -1) {
        // Update existing ticket with new data
        const updatedTickets = [...prevTickets];
        updatedTickets[ticketIndex] = {
          ...updatedTickets[ticketIndex],
          status: ticket.status,
          priority: ticket.priority,
          assigned_to: ticket.assignedTo || null,
        };
        return updatedTickets;
      }
      
      return prevTickets;
    });

    // Also refresh stats for status/assignment changes
    if (['created', 'assigned', 'auto_assigned', 'self_assigned', 'status_changed'].includes(action)) {
      fetchStats();
    }
  }, [fetchStats, toast, user?.id, playSound]);

  // Handle refresh when needed (from real-time updates)
  useEffect(() => {
    if (needsRefresh) {
      fetchTickets();
      fetchStats();
      setNeedsRefresh(false);
    }
  }, [needsRefresh, fetchTickets, fetchStats]);

  // Refresh selected ticket details when it's updated in real-time
  const handleTicketUpdateForDetails = useCallback((update: any) => {
    if (selectedTicket?.id === update.ticket?.id) {
      fetchTicketDetails(update.ticket.id);
    }
  }, [selectedTicket, fetchTicketDetails]);

  // Handle real-time message updates for the selected ticket
  const handleTicketMessage = useCallback((messageData: any) => {
    if (!selectedTicket || selectedTicket.id !== messageData.message.ticket_id) return;
    
    // Play sound for new message from others
    if (messageData.message.user.id !== user?.id) {
      playSound('message');
    }
    
    // Add the new message to the selected ticket's messages
    setSelectedTicket(prev => {
      if (!prev) return prev;
      
      // Check if message already exists
      const existingMessage = prev.messages?.find(m => m.id === messageData.message.id);
      if (existingMessage) return prev;
      
      return {
        ...prev,
        messages: [...(prev.messages || []), messageData.message],
      };
    });
  }, [selectedTicket, user?.id, playSound]);

  // Subscribe to real-time ticket updates
  const { isConnected } = useRealTimeNotifications({
    onTicketUpdate: (update) => {
      handleTicketUpdate(update);
      handleTicketUpdateForDetails(update);
    },
    onTicketMessage: handleTicketMessage,
    ticketId: selectedTicket?.id, // Subscribe to the selected ticket's messages
    showToasts: false, // We handle our own toasts
  });

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchTickets(), fetchStats()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchTickets]);

  const handleStatusChange = async (ticketId: number, status: string) => {
    try {
      const response = await apiClient.updateTicketStatus(ticketId, { status });
      if (response.success) {
        toast({ title: 'Success', description: 'Ticket status updated' });
        fetchTickets();
        fetchStats();
        if (selectedTicket?.id === ticketId) {
          fetchTicketDetails(ticketId);
        }
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const handlePriorityChange = async (ticketId: number, priority: string) => {
    try {
      const response = await apiClient.updateTicketPriority(ticketId, { priority });
      if (response.success) {
        toast({ title: 'Success', description: 'Priority updated' });
        fetchTickets();
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update priority',
        variant: 'destructive',
      });
    }
  };

  const fetchAvailableStaff = async () => {
    try {
      const response = await apiClient.getAvailableStaff();
      if (response.success) {
        setAvailableStaff(response.data as SupportStaff[]);
      }
    } catch (err) {
      console.error('Failed to load staff:', err);
    }
  };

  const handleOpenAssignDialog = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setSelectedStaffId(ticket.assigned_to?.id?.toString() || '');
    setAssignmentNotes('');
    await fetchAvailableStaff();
    setAssignDialogOpen(true);
  };

  const handleAssignTicket = async () => {
    if (!selectedTicket || !selectedStaffId) return;

    try {
      const response = await apiClient.assignTicket(selectedTicket.id, {
        admin_id: parseInt(selectedStaffId),
        notes: assignmentNotes || undefined,
      });
      if (response.success) {
        toast({ title: 'Success', description: 'Ticket assigned successfully' });
        setAssignDialogOpen(false);
        fetchTickets();
        fetchStats();
        if (viewDialogOpen) {
          fetchTicketDetails(selectedTicket.id);
        }
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to assign ticket',
        variant: 'destructive',
      });
    }
  };

  const handleSelfAssign = async (ticketId: number) => {
    try {
      const response = await apiClient.selfAssignTicket(ticketId);
      if (response.success) {
        toast({ title: 'Success', description: 'Ticket assigned to you' });
        fetchTickets();
        fetchStats();
        if (selectedTicket?.id === ticketId) {
          fetchTicketDetails(ticketId);
        }
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to self-assign ticket',
        variant: 'destructive',
      });
    }
  };

  const handleAutoAssign = async (ticketId: number) => {
    try {
      const response = await apiClient.autoAssignTicket(ticketId);
      if (response.success) {
        toast({ title: 'Success', description: 'Ticket auto-assigned successfully' });
        fetchTickets();
        fetchStats();
        if (selectedTicket?.id === ticketId) {
          fetchTicketDetails(ticketId);
        }
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to auto-assign ticket',
        variant: 'destructive',
      });
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim() || sendingMessage) return;

    const tempId = `temp-${Date.now()}`;
    const messageText = replyMessage.trim();
    
    // Optimistic update - add message immediately with pending state
    const optimisticMessage = {
      id: tempId,
      message: messageText,
      sending: true,
      failed: false,
    };
    setPendingMessages(prev => [...prev, optimisticMessage]);
    setReplyMessage('');
    setSendingMessage(true);

    try {
      const response = await apiClient.addTicketMessage(selectedTicket.id, {
        message: messageText,
        is_internal: isInternalNote,
      });
      
      if (response.success) {
        // Remove from pending and refresh to get the real message
        setPendingMessages(prev => prev.filter(m => m.id !== tempId));
        setIsInternalNote(false);
        fetchTicketDetails(selectedTicket.id);
      }
    } catch (err: any) {
      // Mark as failed but keep it visible with retry option
      setPendingMessages(prev => 
        prev.map(m => m.id === tempId ? { ...m, sending: false, failed: true } : m)
      );
      toast({
        title: 'Error',
        description: err.message || 'Failed to send reply',
        variant: 'destructive',
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const retryMessage = async (pendingMsg: typeof pendingMessages[0]) => {
    if (!selectedTicket) return;
    
    // Update to sending state
    setPendingMessages(prev =>
      prev.map(m => m.id === pendingMsg.id ? { ...m, sending: true, failed: false } : m)
    );

    try {
      const response = await apiClient.addTicketMessage(selectedTicket.id, {
        message: pendingMsg.message,
        is_internal: isInternalNote,
      });
      
      if (response.success) {
        setPendingMessages(prev => prev.filter(m => m.id !== pendingMsg.id));
        fetchTicketDetails(selectedTicket.id);
      }
    } catch (err: any) {
      setPendingMessages(prev =>
        prev.map(m => m.id === pendingMsg.id ? { ...m, sending: false, failed: true } : m)
      );
      toast({
        title: 'Error',
        description: err.message || 'Failed to send reply',
        variant: 'destructive',
      });
    }
  };

  const removePendingMessage = (id: string) => {
    setPendingMessages(prev => prev.filter(m => m.id !== id));
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-700">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-700">Medium</Badge>;
      case 'low':
        return <Badge variant="secondary">Low</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-100 text-blue-700">Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-purple-100 text-purple-700">In Progress</Badge>;
      case 'waiting_on_customer':
        return <Badge className="bg-yellow-100 text-yellow-700">Waiting</Badge>;
      case 'resolved':
        return <Badge className="bg-emerald-100 text-emerald-700">Resolved</Badge>;
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground">Manage customer support requests</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Test Sound Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              console.log('Testing urgent sound...');
              playSound('ticket_urgent');
            }}
            title="Test urgent notification sound"
          >
            <Volume2 className="h-4 w-4" />
          </Button>
          {/* Real-time connection indicator */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span>{isConnected ? 'Live updates' : 'Connecting...'}</span>
          </div>
          {/* Manual refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchTickets();
              fetchStats();
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.by_status.open}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.by_status.in_progress} in progress
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
              <User className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unassigned}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgent</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.by_priority.urgent}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.by_priority.high} high priority
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Resolution</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.average_resolution_time ? `${stats.average_resolution_time}h` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Hours to resolve</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="waiting_on_customer">Waiting</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{ticket.ticket_number}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {ticket.subject}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{ticket.user?.name}</p>
                          <p className="text-sm text-muted-foreground">{ticket.user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell>
                        {ticket.assigned_to ? (
                          <div className="flex items-center gap-2">
                            <span>{ticket.assigned_to.name}</span>
                            {!isSupportOfficer && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleOpenAssignDialog(ticket)}
                                title="Reassign"
                              >
                                <UserPlus className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground text-sm">Unassigned</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleSelfAssign(ticket.id)}
                              title="Take this ticket"
                            >
                              <Hand className="h-3 w-3" />
                            </Button>
                            {!isSupportOfficer && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleOpenAssignDialog(ticket)}
                                title="Assign to someone"
                              >
                                <UserPlus className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Clear previous ticket state before loading new one
                              setPendingMessages([]);
                              setReplyMessage('');
                              setIsInternalNote(false);
                              fetchTicketDetails(ticket.id);
                              setViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {tickets.length} of {meta.total} tickets
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {page} of {meta.last_page}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                      disabled={page === meta.last_page}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Ticket Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              {selectedTicket?.ticket_number}
            </DialogTitle>
            <DialogDescription>{selectedTicket?.subject}</DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-6">
              {/* Ticket Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-muted-foreground">Priority</Label>
                  <Select
                    value={selectedTicket.priority}
                    onValueChange={(value) => handlePriorityChange(selectedTicket.id, value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(value) => handleStatusChange(selectedTicket.id, value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="waiting_on_customer">Waiting on Customer</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="mt-1 font-medium capitalize">{selectedTicket.category}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="mt-1 font-medium">
                    {new Date(selectedTicket.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Original Description */}
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <div className="mt-2 p-4 bg-neutral-50 rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              </div>

              {/* Messages */}
              <div>
                <Label className="text-muted-foreground mb-2 block">
                  Conversation ({selectedTicket.messages?.length || 0} messages)
                </Label>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {selectedTicket.messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-lg ${
                        msg.is_internal
                          ? 'bg-yellow-50 border border-yellow-200'
                          : msg.user.role !== 'user'
                          ? 'bg-emerald-50 border border-emerald-200'
                          : 'bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{msg.user.name}</span>
                          {msg.is_internal && (
                            <Badge variant="outline" className="text-xs">
                              Internal Note
                            </Badge>
                          )}
                          {msg.user.role !== 'user' && (
                            <Badge variant="secondary" className="text-xs">
                              Staff
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  ))}
                  
                  {/* Pending messages with preloaders */}
                  {pendingMessages.map((pendingMsg) => (
                    <div
                      key={pendingMsg.id}
                      className={`p-3 rounded-lg border ${
                        pendingMsg.failed
                          ? 'bg-red-50 border-red-200'
                          : 'bg-emerald-50 border-emerald-200 opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{user?.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            Staff
                          </Badge>
                          {pendingMsg.sending && (
                            <span className="flex items-center text-xs text-muted-foreground">
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              Sending...
                            </span>
                          )}
                          {pendingMsg.failed && (
                            <Badge variant="destructive" className="text-xs">
                              Failed to send
                            </Badge>
                          )}
                        </div>
                        {pendingMsg.failed && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => retryMessage(pendingMsg)}
                              className="h-6 px-2 text-xs"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Retry
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removePendingMessage(pendingMsg.id)}
                              className="h-6 px-2 text-xs text-red-500 hover:text-red-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{pendingMsg.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Form */}
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <Label>Reply</Label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="rounded"
                    />
                    Internal note (not visible to customer)
                  </label>
                </div>
                <Textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      handleSendReply();
                    }
                  }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Press Ctrl+Enter to send
                  </span>
                  <Button onClick={handleSendReply} disabled={!replyMessage.trim() || sendingMessage}>
                    {sendingMessage ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {sendingMessage ? 'Sending...' : 'Send Reply'}
                  </Button>
                </div>
              </div>

              {/* Views/Assignment History */}
              {(selectedTicket.views?.length || selectedTicket.assignments?.length) && (
                <div className="border-t pt-4 space-y-4">
                  {selectedTicket.views && selectedTicket.views.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground mb-2 block">
                        <Eye className="h-4 w-4 inline mr-1" />
                        Viewed By
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedTicket.views.map((view) => (
                          <Badge key={view.id} variant="outline" className="text-xs">
                            {view.user.name} ({new Date(view.viewed_at).toLocaleString()})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedTicket.assignments && selectedTicket.assignments.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground mb-2 block">
                        <UserPlus className="h-4 w-4 inline mr-1" />
                        Assignment History
                      </Label>
                      <div className="space-y-2">
                        {selectedTicket.assignments.slice(0, 5).map((assignment) => (
                          <div key={assignment.id} className="text-xs p-2 bg-neutral-50 rounded">
                            <span className="font-medium">{assignment.assignee.name}</span>
                            {' - '}
                            <span className="text-muted-foreground capitalize">
                              {assignment.assignment_type}
                            </span>
                            {assignment.assigner && (
                              <span className="text-muted-foreground">
                                {' by '}{assignment.assigner.name}
                              </span>
                            )}
                            <span className="text-muted-foreground">
                              {' • '}{new Date(assignment.assigned_at).toLocaleString()}
                            </span>
                            {assignment.notes && (
                              <p className="text-muted-foreground mt-1 italic">{assignment.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Ticket Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isSupportOfficer ? 'Take Ticket' : 'Assign Ticket'}</DialogTitle>
            <DialogDescription>
              {isSupportOfficer 
                ? `Take ownership of ticket ${selectedTicket?.ticket_number}.`
                : `Assign ticket ${selectedTicket?.ticket_number} to a support staff member.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!isSupportOfficer && (
              <div className="space-y-2">
                <Label>Select Staff Member</Label>
                <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStaff.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${staff.is_online ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span>{staff.name}</span>
                          <span className="text-muted-foreground text-xs">
                            ({staff.active_tickets_count} active)
                          </span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {staff.role.replace('_', ' ')}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                placeholder="Add a note about this assignment..."
                rows={2}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              {!isSupportOfficer && (
                <Button
                  variant="outline"
                  onClick={() => selectedTicket && handleAutoAssign(selectedTicket.id)}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Auto-Assign
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => selectedTicket && handleSelfAssign(selectedTicket.id)}
                className={isSupportOfficer ? 'w-full' : ''}
              >
                <Hand className="h-4 w-4 mr-2" />
                Take It
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            {!isSupportOfficer && (
              <Button onClick={handleAssignTicket} disabled={!selectedStaffId}>
                Assign Ticket
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
