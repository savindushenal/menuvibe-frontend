'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  HelpCircle, 
  Plus, 
  MessageSquare, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Send,
  ArrowLeft,
  XCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Ticket {
  id: number;
  ticket_number: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

interface Message {
  id: number;
  message: string;
  is_internal: boolean;
  created_at: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

const CATEGORIES = {
  technical: 'Technical Issue',
  billing: 'Billing & Subscription',
  feature_request: 'Feature Request',
  account: 'Account Help',
  franchise: 'Franchise Support',
  other: 'Other',
};

const PRIORITIES = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-700' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-700' },
};

const STATUSES = {
  open: { label: 'Open', color: 'bg-green-100 text-green-700', icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: Clock },
  waiting_on_customer: { label: 'Awaiting Reply', color: 'bg-amber-100 text-amber-700', icon: MessageSquare },
  resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-700', icon: XCircle },
};

export default function FranchiseHelpPage() {
  const params = useParams();
  const franchiseSlug = params.franchise as string;
  
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'franchise',
    priority: 'medium',
  });

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const queryString = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const response = await api.get(`/help-tickets${queryString}`);
      
      if (response.data.success) {
        setTickets(response.data.data.data || response.data.data || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch tickets:', err);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const fetchTicketDetails = async (ticketId: number) => {
    try {
      const response = await api.get(`/help-tickets/${ticketId}`);
      if (response.data.success) {
        setSelectedTicket(response.data.data);
      }
    } catch (err: any) {
      toast.error('Failed to load ticket details');
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      console.log('Creating ticket with data:', formData);
      const response = await api.post('/help-tickets', formData);
      console.log('Ticket response:', response);
      
      if (response.data.success) {
        toast.success('Ticket created successfully');
        setNewTicketOpen(false);
        setFormData({
          subject: '',
          description: '',
          category: 'franchise',
          priority: 'medium',
        });
        fetchTickets();
      } else {
        toast.error(response.data.message || 'Failed to create ticket');
      }
    } catch (err: any) {
      console.error('Ticket creation error:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;

    try {
      setSendingMessage(true);
      const response = await api.post(`/help-tickets/${selectedTicket.id}/messages`, {
        message: newMessage
      });
      
      if (response.data.success) {
        setNewMessage('');
        fetchTicketDetails(selectedTicket.id);
        toast.success('Message sent');
      }
    } catch (err: any) {
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;

    try {
      const response = await api.post(`/help-tickets/${selectedTicket.id}/status`, {
        action: 'close'
      });
      
      if (response.data.success) {
        toast.success('Ticket closed');
        setSelectedTicket(null);
        fetchTickets();
      }
    } catch (err: any) {
      toast.error('Failed to close ticket');
    }
  };

  const handleReopenTicket = async () => {
    if (!selectedTicket) return;

    try {
      const response = await api.post(`/help-tickets/${selectedTicket.id}/status`, {
        action: 'reopen'
      });
      
      if (response.data.success) {
        toast.success('Ticket reopened');
        fetchTicketDetails(selectedTicket.id);
        fetchTickets();
      }
    } catch (err: any) {
      toast.error('Failed to reopen ticket');
    }
  };

  const getStatusInfo = (status: string) => {
    return STATUSES[status as keyof typeof STATUSES] || STATUSES.open;
  };

  const getPriorityInfo = (priority: string) => {
    return PRIORITIES[priority as keyof typeof PRIORITIES] || PRIORITIES.medium;
  };

  // Ticket detail view
  if (selectedTicket) {
    const statusInfo = getStatusInfo(selectedTicket.status);
    const StatusIcon = statusInfo.icon;
    const isClosed = ['resolved', 'closed'].includes(selectedTicket.status);

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tickets
          </Button>
        </div>

        <Card>
          <CardHeader className="border-b">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">{selectedTicket.ticket_number}</Badge>
                  <Badge className={statusInfo.color}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusInfo.label}
                  </Badge>
                  <Badge className={getPriorityInfo(selectedTicket.priority).color}>
                    {getPriorityInfo(selectedTicket.priority).label}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{selectedTicket.subject}</CardTitle>
                <CardDescription>
                  {CATEGORIES[selectedTicket.category as keyof typeof CATEGORIES]} • 
                  Created {formatDistanceToNow(new Date(selectedTicket.created_at), { addSuffix: true })}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {isClosed ? (
                  <Button variant="outline" onClick={handleReopenTicket}>
                    Reopen Ticket
                  </Button>
                ) : (
                  <Button variant="outline" onClick={handleCloseTicket}>
                    Close Ticket
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {/* Messages */}
            <ScrollArea className="h-[400px] p-4">
              <div className="space-y-4">
                {selectedTicket.messages?.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.user.role === 'admin' || msg.user.role === 'super_admin' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      msg.user.role === 'admin' || msg.user.role === 'super_admin'
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-primary text-primary-foreground'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{msg.user.name}</span>
                        {(msg.user.role === 'admin' || msg.user.role === 'super_admin') && (
                          <Badge variant="secondary" className="text-xs">Support</Badge>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      <p className={`text-xs mt-1 ${
                        msg.user.role === 'admin' || msg.user.role === 'super_admin'
                          ? 'text-gray-500'
                          : 'text-primary-foreground/70'
                      }`}>
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Reply input */}
            {!isClosed && (
              <div className="p-4 border-t bg-gray-50">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 min-h-[80px]"
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={sendingMessage || !newMessage.trim()}
                    className="self-end"
                  >
                    {sendingMessage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ticket list view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Help & Support</h1>
          <p className="text-neutral-600">Create and manage your support tickets</p>
        </div>
        <Button onClick={() => setNewTicketOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Tickets List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-96" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <HelpCircle className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No tickets yet</h3>
            <p className="text-neutral-600 mb-4">Create a ticket to get help from our support team</p>
            <Button onClick={() => setNewTicketOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const statusInfo = getStatusInfo(ticket.status);
            const StatusIcon = statusInfo.icon;
            
            return (
              <Card 
                key={ticket.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => fetchTicketDetails(ticket.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {ticket.ticket_number}
                        </Badge>
                        <Badge className={`${statusInfo.color} text-xs`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                        <Badge className={`${getPriorityInfo(ticket.priority).color} text-xs`}>
                          {getPriorityInfo(ticket.priority).label}
                        </Badge>
                      </div>
                      <h3 className="font-medium text-neutral-900">{ticket.subject}</h3>
                      <p className="text-sm text-neutral-500 mt-1 line-clamp-1">
                        {ticket.description}
                      </p>
                    </div>
                    <div className="text-right text-sm text-neutral-500">
                      <p>{formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Ticket Dialog */}
      <Dialog open={newTicketOpen} onOpenChange={setNewTicketOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleCreateTicket}>
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
              <DialogDescription>
                Describe your issue and our team will get back to you as soon as possible.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your issue"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  disabled={submitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORIES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(v) => setFormData({ ...formData, priority: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORITIES).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Please describe your issue in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={submitting}
                  rows={5}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewTicketOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Ticket
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
