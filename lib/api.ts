const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
  meta?: {
    can_add_location?: boolean;
    remaining_quota?: number;
    max_locations?: number;
    [key: string]: any;
  };
}

interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string;
  google_id?: string;
  role: 'user' | 'admin' | 'super_admin' | 'support_officer';
  is_active: boolean;
  is_online?: boolean;
  last_seen_at?: string;
  active_tickets_count?: number;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  // Computed property for support ticket access
  canHandleSupportTickets?: boolean;
}

interface UserContext {
  type: 'personal' | 'franchise';
  id: number | null;
  slug: string | null;
  name: string;
  logo_url?: string | null;
  role: string;
  branch?: string | null;
  locations_count?: number;
  redirect: string;
}

interface AuthData {
  user: User;
  token: string;
  token_type?: string;
  contexts?: UserContext[];
  default_redirect?: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  }

  private async request<T>(endpoint: string, options: RequestInit & { skipJsonContentType?: boolean } = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Always refresh token from localStorage before making requests
    if (typeof window !== 'undefined') {
      const storageToken = localStorage.getItem('auth_token');
      // Always prefer the latest token from localStorage
      if (storageToken) {
        this.token = storageToken;
      }
      // Debug logging
      console.log('[API] Request to:', endpoint, '| Token exists:', !!this.token, '| Token preview:', this.token?.substring(0, 20) + '...');
    }
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(options.headers as Record<string, string>),
    };
    
    // Only set Content-Type if not sending FormData (let browser set multipart/form-data automatically)
    if (!options.skipJsonContentType) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      // Destructure to exclude custom options and only pass standard fetch options
      const { skipJsonContentType, ...fetchOptions } = options as any;
      
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || `HTTP ${response.status}: ${response.statusText}`) as any;
        error.response = data; // Include the response data for validation errors
        throw error;
      }

      return data;
    } catch (error: any) {
      // Don't log 404 errors for business profile as they're expected for new users
      const isBusinessProfile404 = 
        url.includes('/business-profile') && 
        (error.message?.includes('404') || error.message?.includes('Not Found'));
      
      if (!isBusinessProfile404) {
        console.error('API Error:', error);
      }
      
      // Handle network errors more gracefully
      if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
        throw new Error('Unable to connect to server. Please check if the server is running.');
      }
      
      throw error;
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  // Auth endpoints
  async register(data: { name: string; email: string; password: string; password_confirmation: string }): Promise<ApiResponse<AuthData>> {
    return this.request<AuthData>('/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }): Promise<ApiResponse<AuthData>> {
    return this.request<AuthData>('/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/logout', {
      method: 'POST',
    });
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    return this.request('/user');
  }

  async getContexts(): Promise<ApiResponse<{ contexts: any[], default_redirect: string }>> {
    return this.request('/auth/contexts');
  }

  async googleAuth(accessToken: string): Promise<ApiResponse<AuthData>> {
    return this.request<AuthData>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ access_token: accessToken }),
    });
  }

  async getDashboard(): Promise<ApiResponse> {
    return this.request('/dashboard');
  }

  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health');
  }

  // Business Profile endpoints
  async createBusinessProfile(data: any): Promise<ApiResponse> {
    return this.request('/business-profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getBusinessProfile(): Promise<ApiResponse> {
    try {
      const response = await this.request('/business-profile');
      
      // Backend now returns 200 with business_profile: null for new users
      // Ensure we always have the expected structure
      if (response.success && response.data) {
        const data = response.data as { business_profile?: any; needs_onboarding?: boolean };
        return {
          success: true,
          message: response.message || 'Business profile loaded successfully',
          data: {
            business_profile: data.business_profile || null,
            needs_onboarding: data.needs_onboarding !== undefined 
              ? data.needs_onboarding 
              : !data.business_profile
          }
        };
      }
      
      return response;
    } catch (error: any) {
      // Log unexpected errors
      console.error('Unexpected error in getBusinessProfile:', error);
      throw error;
    }
  }

  async updateBusinessProfile(data: FormData): Promise<ApiResponse> {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      };

      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      // Don't set Content-Type for FormData - let the browser set it with boundary
      const response = await fetch(`${this.baseURL}/business-profile`, {
        method: 'PUT',
        headers,
        body: data,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      return responseData;
    } catch (error: any) {
      console.error('Error updating business profile:', error);
      throw error;
    }
  }

  async completeOnboarding(): Promise<ApiResponse> {
    return this.request('/business-profile/complete-onboarding', {
      method: 'POST',
    });
  }

  // Location endpoints
  async getLocations(): Promise<ApiResponse> {
    try {
      return await this.request('/locations');
    } catch (error: any) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  }

  async createLocation(data: any): Promise<ApiResponse> {
    try {
      return await this.request('/locations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error: any) {
      console.error('Error creating location:', error);
      throw error;
    }
  }

  async updateLocation(locationId: number, data: any): Promise<ApiResponse> {
    try {
      return await this.request(`/locations/${locationId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error: any) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  async deleteLocation(locationId: number): Promise<ApiResponse> {
    try {
      return await this.request(`/locations/${locationId}`, {
        method: 'DELETE',
      });
    } catch (error: any) {
      console.error('Error deleting location:', error);
      throw error;
    }
  }

  async setDefaultLocation(locationId: number): Promise<ApiResponse> {
    try {
      return await this.request(`/locations/${locationId}/set-default`, {
        method: 'POST',
      });
    } catch (error: any) {
      console.error('Error setting default location:', error);
      throw error;
    }
  }

  async getMenus(locationId?: string): Promise<ApiResponse> {
    try {
      const url = locationId ? `/menus?location_id=${locationId}` : '/menus';
      return await this.request(url);
    } catch (error: any) {
      console.error('Error fetching menus:', error);
      throw error;
    }
  }

  async getMenu(menuId: number): Promise<ApiResponse> {
    try {
      return await this.request(`/menus/${menuId}`);
    } catch (error: any) {
      console.error('Error fetching menu:', error);
      throw error;
    }
  }

  async createMenu(data: FormData): Promise<ApiResponse> {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      };

      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      const response = await fetch(`${this.baseURL}/menus`, {
        method: 'POST',
        headers,
        body: data,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      return responseData;
    } catch (error: any) {
      console.error('Error creating menu:', error);
      throw error;
    }
  }

  async updateMenu(menuId: number, data: FormData): Promise<ApiResponse> {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      };

      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      const response = await fetch(`${this.baseURL}/menus/${menuId}`, {
        method: 'PUT',
        headers,
        body: data,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      return responseData;
    } catch (error: any) {
      console.error('Error updating menu:', error);
      throw error;
    }
  }

  async deleteMenu(menuId: number): Promise<ApiResponse> {
    try {
      return await this.request(`/menus/${menuId}`, {
        method: 'DELETE',
      });
    } catch (error: any) {
      console.error('Error deleting menu:', error);
      throw error;
    }
  }

  async getMenuItems(menuId: number): Promise<ApiResponse> {
    try {
      return await this.request(`/menus/${menuId}/items`);
    } catch (error: any) {
      console.error('Error fetching menu items:', error);
      throw error;
    }
  }

  async createMenuItem(menuId: number, data: FormData): Promise<ApiResponse> {
    try {
      // Log request details for debugging
      console.log('Creating menu item for menu ID:', menuId);
      console.log('FormData entries:', Array.from(data.entries()));

      // Use the standard request method but with FormData
      const url = `/menus/${menuId}/items`;
      
      // Always refresh token from localStorage before making requests
      if (typeof window !== 'undefined') {
        this.token = localStorage.getItem('auth_token');
      }
      
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      };

      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'POST',
        headers,
        body: data,
      });

      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        throw new Error('Invalid response format from server');
      }
      
      console.log('Response status:', response.status);
      console.log('Response data:', responseData);

      if (!response.ok) {
        // Log validation errors
        if (response.status === 422 && responseData.errors) {
          console.error('Validation errors:', responseData.errors);
        }
        
        // Handle subscription limit errors specifically
        if (response.status === 403 && responseData.message?.includes('limit')) {
          throw new Error(`SUBSCRIPTION_LIMIT: ${responseData.message}`);
        }
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      // Ensure we have a success property
      if (typeof responseData.success === 'undefined') {
        responseData.success = true;
      }

      return responseData;
    } catch (error: any) {
      console.error('Error creating menu item:', error);
      throw error;
    }
  }

  async updateMenuItem(menuId: number, itemId: number, data: FormData): Promise<ApiResponse> {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      };

      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      // Add _method for Laravel to recognize this as a PUT request
      data.append('_method', 'PUT');

      const response = await fetch(`${this.baseURL}/menus/${menuId}/items/${itemId}`, {
        method: 'POST',
        headers,
        body: data,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      return responseData;
    } catch (error: any) {
      console.error('Error updating menu item:', error);
      throw error;
    }
  }

  async deleteMenuItem(menuId: number, itemId: number): Promise<ApiResponse> {
    try {
      return await this.request(`/menus/${menuId}/items/${itemId}`, {
        method: 'DELETE',
      });
    } catch (error: any) {
      console.error('Error deleting menu item:', error);
      throw error;
    }
  }

  // Menu styling and customization API methods
  async updateMenuStyle(menuId: number, styleData: any): Promise<ApiResponse> {
    try {
      return await this.request(`/menus/${menuId}/style`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(styleData),
      });
    } catch (error: any) {
      console.error('Error updating menu style:', error);
      throw error;
    }
  }

  async getMenuStyle(menuId: number): Promise<ApiResponse> {
    try {
      return await this.request(`/menus/${menuId}/style`);
    } catch (error: any) {
      console.error('Error fetching menu style:', error);
      throw error;
    }
  }

  async checkMenuItemLimits(menuId: number): Promise<ApiResponse> {
    try {
      console.log('Checking menu item limits for menu ID:', menuId);
      const response = await this.request(`/menus/${menuId}/limits`);
      console.log('Limits response:', response);
      return response;
    } catch (error: any) {
      console.error('Error checking menu item limits:', error);
      throw error;
    }
  }

  async reorderMenuItems(menuId: number, itemIds: number[]): Promise<ApiResponse> {
    try {
      // Convert item IDs to items with sort_order
      const items = itemIds.map((id, index) => ({
        id,
        sort_order: index
      }));

      return await this.request(`/menus/${menuId}/items/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });
    } catch (error: any) {
      console.error('Error reordering menu items:', error);
      throw error;
    }
  }

  async uploadMenuBackground(menuId: number, file: File): Promise<ApiResponse> {
    try {
      const formData = new FormData();
      formData.append('background_image', file);

      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      };

      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      const response = await fetch(`${this.baseURL}/menus/${menuId}/background`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      return responseData;
    } catch (error: any) {
      console.error('Error uploading menu background:', error);
      throw error;
    }
  }

  async deleteMenuBackground(menuId: number): Promise<ApiResponse> {
    try {
      return await this.request(`/menus/${menuId}/background`, {
        method: 'DELETE',
      });
    } catch (error: any) {
      console.error('Error deleting menu background:', error);
      throw error;
    }
  }

  // Menu Category API methods
  async getMenuCategories(menuId: number): Promise<ApiResponse> {
    try {
      return await this.request(`/menus/${menuId}/categories`);
    } catch (error: any) {
      console.error('Error fetching menu categories:', error);
      throw error;
    }
  }

  async createMenuCategory(menuId: number, data: any): Promise<ApiResponse> {
    try {
      return await this.request(`/menus/${menuId}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (error: any) {
      console.error('Error creating menu category:', error);
      throw error;
    }
  }

  async updateMenuCategory(menuId: number, categoryId: number, data: any): Promise<ApiResponse> {
    try {
      return await this.request(`/menus/${menuId}/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (error: any) {
      console.error('Error updating menu category:', error);
      throw error;
    }
  }

  async deleteMenuCategory(menuId: number, categoryId: number): Promise<ApiResponse> {
    try {
      return await this.request(`/menus/${menuId}/categories/${categoryId}`, {
        method: 'DELETE',
      });
    } catch (error: any) {
      console.error('Error deleting menu category:', error);
      throw error;
    }
  }

  async reorderMenuCategories(menuId: number, categoryIds: number[]): Promise<ApiResponse> {
    try {
      return await this.request(`/menus/${menuId}/categories/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category_ids: categoryIds }),
      });
    } catch (error: any) {
      console.error('Error reordering menu categories:', error);
      throw error;
    }
  }

  // Subscription API methods
  async getSubscriptionPlans(): Promise<ApiResponse> {
    try {
      return await this.request('/subscription-plans');
    } catch (error: any) {
      console.error('Error fetching subscription plans:', error);
      throw error;
    }
  }

  async getCurrentSubscription(): Promise<ApiResponse> {
    try {
      return await this.request('/subscription/current');
    } catch (error: any) {
      console.error('Error fetching current subscription:', error);
      throw error;
    }
  }

  async startTrial(planId: number): Promise<ApiResponse> {
    try {
      return await this.request(`/subscription/trial/${planId}`, {
        method: 'POST',
      });
    } catch (error: any) {
      console.error('Error starting trial:', error);
      throw error;
    }
  }

  async getUpgradeRecommendations(): Promise<ApiResponse> {
    try {
      return await this.request('/subscription/recommendations');
    } catch (error: any) {
      console.error('Error fetching upgrade recommendations:', error);
      throw error;
    }
  }

  async changeSubscription(planId: string): Promise<ApiResponse> {
    try {
      return await this.request('/subscriptions/change', {
        method: 'POST',
        body: JSON.stringify({ plan_id: planId }),
      });
    } catch (error: any) {
      console.error('Error changing subscription:', error);
      throw error;
    }
  }

  // Settings API methods
  async getSettings(): Promise<ApiResponse> {
    try {
      return await this.request('/settings');
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  }

  async updateAccountSettings(data: {
    name?: string;
    email?: string;
    phone?: string;
  }): Promise<ApiResponse> {
    try {
      return await this.request('/settings/account', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error: any) {
      console.error('Error updating account settings:', error);
      throw error;
    }
  }

  async updateNotificationSettings(data: {
    email_notifications?: boolean;
    push_notifications?: boolean;
    sms_notifications?: boolean;
    marketing_emails?: boolean;
    order_updates?: boolean;
    menu_updates?: boolean;
    customer_feedback_notifications?: boolean;
    inventory_alerts?: boolean;
    daily_reports?: boolean;
    weekly_reports?: boolean;
    monthly_reports?: boolean;
  }): Promise<ApiResponse> {
    try {
      return await this.request('/settings/notifications', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error: any) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  async updateSecuritySettings(data: {
    two_factor_enabled?: boolean;
    session_timeout?: number;
    login_alerts?: boolean;
    password_expiry_days?: number | null;
  }): Promise<ApiResponse> {
    try {
      return await this.request('/settings/security', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error: any) {
      console.error('Error updating security settings:', error);
      throw error;
    }
  }

  async updatePrivacySettings(data: {
    profile_visibility?: string;
    show_online_status?: boolean;
    allow_search_engines?: boolean;
    data_collection?: boolean;
    analytics_tracking?: boolean;
  }): Promise<ApiResponse> {
    try {
      return await this.request('/settings/privacy', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error: any) {
      console.error('Error updating privacy settings:', error);
      throw error;
    }
  }

  async updateDisplaySettings(data: {
    theme?: string;
    language?: string;
    timezone?: string;
    date_format?: string;
    time_format?: string;
    items_per_page?: number;
  }): Promise<ApiResponse> {
    try {
      return await this.request('/settings/display', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error: any) {
      console.error('Error updating display settings:', error);
      throw error;
    }
  }

  async updateBusinessSettings(data: {
    business_hours_display?: boolean;
    auto_accept_orders?: boolean;
    order_confirmation_required?: boolean;
    menu_availability_alerts?: boolean;
  }): Promise<ApiResponse> {
    try {
      return await this.request('/settings/business', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error: any) {
      console.error('Error updating business settings:', error);
      throw error;
    }
  }

  async resetSettingsToDefaults(category?: string): Promise<ApiResponse> {
    try {
      const body = category ? JSON.stringify({ category }) : undefined;
      return await this.request('/settings/reset', {
        method: 'POST',
        body,
      });
    } catch (error: any) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  }

  // QR Code API methods
  async getQRCodes(locationId?: string): Promise<ApiResponse> {
    try {
      const params = locationId ? `?location_id=${locationId}` : '';
      return await this.request(`/qr-codes${params}`);
    } catch (error: any) {
      console.error('Error fetching QR codes:', error);
      throw error;
    }
  }

  async createQRCode(data: {
    name: string;
    menu_id?: number;
    table_number?: string;
    location_id?: number;
  }): Promise<ApiResponse> {
    try {
      return await this.request('/qr-codes', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error: any) {
      console.error('Error creating QR code:', error);
      throw error;
    }
  }

  async updateQRCode(id: number, data: {
    name?: string;
    menu_id?: number;
    table_number?: string;
  }): Promise<ApiResponse> {
    try {
      return await this.request(`/qr-codes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch (error: any) {
      console.error('Error updating QR code:', error);
      throw error;
    }
  }

  async deleteQRCode(id: number): Promise<ApiResponse> {
    try {
      return await this.request(`/qr-codes/${id}`, {
        method: 'DELETE',
      });
    } catch (error: any) {
      console.error('Error deleting QR code:', error);
      throw error;
    }
  }

  async getQRCode(id: number): Promise<ApiResponse> {
    try {
      return await this.request(`/qr-codes/${id}`);
    } catch (error: any) {
      console.error('Error fetching QR code:', error);
      throw error;
    }
  }

  // ==================== Admin API Methods ====================

  // Admin Dashboard
  async getAdminDashboard(): Promise<ApiResponse> {
    return this.request('/admin/dashboard');
  }

  // Admin Users
  async getAdminUsers(params?: URLSearchParams): Promise<ApiResponse> {
    const queryString = params ? `?${params.toString()}` : '';
    return this.request(`/admin/users${queryString}`);
  }

  async getAdminUser(id: number): Promise<ApiResponse> {
    return this.request(`/admin/users/${id}`);
  }

  async updateAdminUser(id: number, data: Record<string, any>): Promise<ApiResponse> {
    return this.request(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAdminUser(id: number): Promise<ApiResponse> {
    return this.request(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleUserStatus(id: number, data: { action: string; reason?: string }): Promise<ApiResponse> {
    return this.request(`/admin/users/${id}/toggle-status`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resetUserPassword(id: number, data: { password: string }): Promise<ApiResponse> {
    return this.request(`/admin/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateAndSendPassword(id: number): Promise<ApiResponse> {
    return this.request(`/admin/users/${id}/send-password`, {
      method: 'POST',
    });
  }

  async createAdmin(data: { name: string; email: string; password: string; role: string }): Promise<ApiResponse> {
    return this.request('/admin/admins', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin Subscriptions
  async getAdminSubscriptions(params?: URLSearchParams): Promise<ApiResponse> {
    const queryString = params ? `?${params.toString()}` : '';
    return this.request(`/admin/subscriptions${queryString}`);
  }

  async getAdminSubscriptionPlans(): Promise<ApiResponse> {
    return this.request('/admin/subscription-plans');
  }

  async getAdminSubscriptionStats(): Promise<ApiResponse> {
    return this.request('/admin/subscriptions/statistics');
  }

  async updateSubscriptionPlan(id: number, data: Record<string, any>): Promise<ApiResponse> {
    return this.request(`/admin/subscription-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async cancelSubscription(id: number, data: { reason?: string }): Promise<ApiResponse> {
    return this.request(`/admin/subscriptions/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async changeUserSubscription(userId: number, data: { plan_id: number; reason?: string }): Promise<ApiResponse> {
    return this.request(`/admin/users/${userId}/subscription`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin Tickets
  async getAdminTickets(params?: URLSearchParams): Promise<ApiResponse> {
    const queryString = params ? `?${params.toString()}` : '';
    return this.request(`/admin/tickets${queryString}`);
  }

  async getAdminTicket(id: number): Promise<ApiResponse> {
    return this.request(`/admin/tickets/${id}`);
  }

  async getAdminTicketStats(): Promise<ApiResponse> {
    return this.request('/admin/tickets/statistics');
  }

  async updateTicketStatus(id: number, data: { status: string }): Promise<ApiResponse> {
    return this.request(`/admin/tickets/${id}/status`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTicketPriority(id: number, data: { priority: string }): Promise<ApiResponse> {
    return this.request(`/admin/tickets/${id}/priority`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addTicketMessage(id: number, data: { message: string }): Promise<ApiResponse> {
    return this.request(`/admin/tickets/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async assignTicket(id: number, data: { admin_id: number; notes?: string }): Promise<ApiResponse> {
    return this.request(`/admin/tickets/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async autoAssignTicket(id: number): Promise<ApiResponse> {
    return this.request(`/admin/tickets/${id}/auto-assign`, {
      method: 'POST',
    });
  }

  async selfAssignTicket(id: number): Promise<ApiResponse> {
    return this.request(`/admin/tickets/${id}/self-assign`, {
      method: 'POST',
    });
  }

  async getAvailableStaff(): Promise<ApiResponse> {
    return this.request('/admin/tickets/available-staff');
  }

  // Notifications
  async getNotifications(params?: URLSearchParams): Promise<ApiResponse> {
    const queryString = params ? `?${params.toString()}` : '';
    return this.request(`/admin/notifications${queryString}`);
  }

  async getUnreadNotificationCount(): Promise<ApiResponse> {
    return this.request('/admin/notifications/unread-count');
  }

  async markNotificationAsRead(id: number): Promise<ApiResponse> {
    return this.request(`/admin/notifications/${id}/read`, {
      method: 'POST',
    });
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse> {
    return this.request('/admin/notifications/mark-all-read', {
      method: 'POST',
    });
  }

  async deleteNotification(id: number): Promise<ApiResponse> {
    return this.request(`/admin/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  async clearAllNotifications(): Promise<ApiResponse> {
    return this.request('/admin/notifications', {
      method: 'DELETE',
    });
  }

  async sendHeartbeat(): Promise<ApiResponse> {
    return this.request('/admin/status/heartbeat', {
      method: 'POST',
    });
  }

  async goOffline(): Promise<ApiResponse> {
    return this.request('/admin/status/offline', {
      method: 'POST',
    });
  }

  // Admin Activity Logs
  async getAdminActivityLogs(params?: URLSearchParams): Promise<ApiResponse> {
    const queryString = params ? `?${params.toString()}` : '';
    return this.request(`/admin/activity${queryString}`);
  }

  async getAdminActivityActions(): Promise<ApiResponse> {
    return this.request('/admin/activity/actions');
  }

  async getAdminActivityAdmins(): Promise<ApiResponse> {
    return this.request('/admin/activity/admins');
  }

  // Admin Settings
  async getAdminSettings(): Promise<ApiResponse> {
    return this.request('/admin/settings');
  }

  async updateAdminSetting(key: string, data: { value: any }): Promise<ApiResponse> {
    return this.request(`/admin/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateAdminSettingsBulk(data: { settings: Record<string, any> }): Promise<ApiResponse> {
    return this.request('/admin/settings/bulk', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Admin Franchises
  async getAdminFranchises(params?: URLSearchParams): Promise<ApiResponse> {
    const queryString = params ? `?${params.toString()}` : '';
    return this.request(`/admin/franchises${queryString}`);
  }

  async getAdminFranchise(id: number): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${id}`);
  }

  async getAdminFranchiseStats(): Promise<ApiResponse> {
    return this.request('/admin/franchises/statistics');
  }

  async updateAdminFranchise(id: number, data: Record<string, any>): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async toggleFranchiseStatus(id: number): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${id}/toggle-status`, {
      method: 'POST',
    });
  }

  async transferFranchiseOwnership(id: number, data: { new_owner_id: number }): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${id}/transfer-ownership`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteAdminFranchise(id: number): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${id}`, {
      method: 'DELETE',
    });
  }

  // Franchise Onboarding & Management APIs
  async onboardFranchise(data: {
    name: string;
    description?: string;
    owner_email: string;
    owner_name: string;
    owner_phone?: string;
    pricing_type: 'fixed_yearly' | 'pay_as_you_go' | 'custom';
    yearly_price?: number;
    per_branch_price?: number;
    initial_branches?: number;
    setup_fee?: number;
    billing_cycle?: 'monthly' | 'quarterly' | 'yearly';
    contract_start_date?: string;
    contract_end_date?: string;
    custom_terms?: string;
    send_credentials?: boolean;
    create_owner_account?: boolean;
  }): Promise<ApiResponse> {
    return this.request('/admin/franchises/onboard', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFranchiseDetails(id: number): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${id}/details`);
  }

  // Franchise Branches
  async addFranchiseBranch(franchiseId: number, data: {
    branch_name: string;
    address?: string;
    city?: string;
    phone?: string;
    location_id?: number;
  }): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/branches`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFranchiseBranches(franchiseId: number): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/branches`);
  }

  async updateFranchiseBranch(franchiseId: number, branchId: number, data: {
    branch_name?: string;
    address?: string;
    city?: string;
    phone?: string;
    is_active?: boolean;
    is_paid?: boolean;
  }): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/branches/${branchId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFranchiseBranch(franchiseId: number, branchId: number): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/branches/${branchId}`, {
      method: 'DELETE',
    });
  }

  // Franchise Payments
  async recordFranchisePayment(franchiseId: number, data: {
    amount: number;
    payment_type: 'setup' | 'monthly' | 'quarterly' | 'yearly' | 'branch_addition' | 'custom';
    status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
    due_date: string;
    paid_date?: string;
    payment_method?: string;
    transaction_reference?: string;
    notes?: string;
    branches_count?: number;
    period_start?: string;
    period_end?: string;
  }): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFranchisePayments(franchiseId: number): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/payments`);
  }

  async updateFranchisePayment(franchiseId: number, paymentId: number, data: {
    status?: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
    paid_date?: string;
    payment_method?: string;
    transaction_reference?: string;
    notes?: string;
  }): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/payments/${paymentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Franchise Pricing
  async updateFranchisePricing(franchiseId: number, data: {
    pricing_type: 'fixed_yearly' | 'pay_as_you_go' | 'custom';
    yearly_price?: number;
    per_branch_price?: number;
    initial_branches?: number;
    setup_fee?: number;
    billing_cycle?: 'monthly' | 'quarterly' | 'yearly';
    contract_start_date?: string;
    contract_end_date?: string;
    custom_terms?: string;
  }): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/pricing`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Franchise Accounts
  async createFranchiseAccount(franchiseId: number, data: {
    name: string;
    email: string;
    phone?: string;
    role: 'franchise_owner' | 'franchise_manager' | 'branch_manager' | 'staff';
    branch_id?: number;
    send_credentials?: boolean;
    custom_password?: string;
  }): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/accounts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFranchiseAccounts(franchiseId: number): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/accounts`);
  }

  // Franchise Invitations
  async sendFranchiseInvitation(franchiseId: number, data: {
    email: string;
    name?: string;
    role: 'franchise_owner' | 'franchise_manager' | 'branch_manager' | 'staff';
    branch_id?: number;
    message?: string;
    send_credentials?: boolean;
    expires_in_days?: number;
  }): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/invitations`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFranchiseInvitations(franchiseId: number): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/invitations`);
  }

  async resendFranchiseInvitation(franchiseId: number, invitationId: number): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/invitations/${invitationId}/resend`, {
      method: 'POST',
    });
  }

  async cancelFranchiseInvitation(franchiseId: number, invitationId: number): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/invitations/${invitationId}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // ADMIN FRANCHISE TEMPLATE MANAGEMENT APIs
  // ============================================

  // Franchise Menu Templates
  async getFranchiseMenus(franchiseId: number): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/menus`);
  }

  async createFranchiseMenu(franchiseId: number, data: {
    name: string;
    description?: string;
    currency?: string;
    slug?: string;
    settings?: {
      template_type?: string;
      show_prices?: boolean;
      show_images?: boolean;
      currency_symbol?: string;
    };
  }): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/menus`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFranchiseMenu(franchiseId: number, templateId: number, data: any): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/menus/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFranchiseMenu(franchiseId: number, templateId: number): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/menus/${templateId}`, {
      method: 'DELETE',
    });
  }

  // Franchise Menu Categories
  async getFranchiseCategories(franchiseId: number, templateId: number): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/menus/${templateId}/categories`);
  }

  async createFranchiseCategory(franchiseId: number, templateId: number, data: {
    name: string;
    description?: string;
    icon?: string;
    sort_order?: number;
  }): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/menus/${templateId}/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFranchiseCategory(franchiseId: number, templateId: number, categoryId: number, data: any): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/menus/${templateId}/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFranchiseCategory(franchiseId: number, templateId: number, categoryId: number): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/menus/${templateId}/categories/${categoryId}`, {
      method: 'DELETE',
    });
  }

  // Franchise Menu Items
  async getFranchiseItems(franchiseId: number, templateId: number, categoryId?: number): Promise<ApiResponse> {
    const params = categoryId ? `?category_id=${categoryId}` : '';
    return this.request(`/admin/franchises/${franchiseId}/menus/${templateId}/items${params}`);
  }

  async createFranchiseItem(franchiseId: number, templateId: number, data: {
    category_id: number;
    name: string;
    description?: string;
    price: number;
    currency?: string;
    image_url?: string;
    icon?: string;
    is_available?: boolean;
    is_featured?: boolean;
    sort_order?: number;
  }): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/menus/${templateId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFranchiseItem(franchiseId: number, templateId: number, itemId: number, data: any): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/menus/${templateId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFranchiseItem(franchiseId: number, templateId: number, itemId: number): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/menus/${templateId}/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  // Franchise QR Endpoints
  async getFranchiseEndpoints(franchiseId: number): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/endpoints`);
  }

  async createFranchiseEndpoint(franchiseId: number, data: {
    menu_template_id: number;
    location_id?: number;
    short_code?: string;
    name?: string;
    table_number?: string;
    is_active?: boolean;
  }): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/endpoints`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateFranchiseEndpoint(franchiseId: number, endpointId: number, data: any): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/endpoints/${endpointId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteFranchiseEndpoint(franchiseId: number, endpointId: number): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/endpoints/${endpointId}`, {
      method: 'DELETE',
    });
  }

  async createBulkFranchiseEndpoints(franchiseId: number, data: {
    menu_template_id: number;
    location_id: number;
    table_prefix: string;
    table_start: number;
    table_end: number;
  }): Promise<ApiResponse> {
    return this.request(`/admin/franchises/${franchiseId}/endpoints/bulk`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // TEMPLATE MENU SYSTEM APIs
  // ============================================

  // Menu Templates
  async getMenuTemplates(locationId?: number): Promise<ApiResponse> {
    const params = locationId ? `?location_id=${locationId}` : '';
    return this.request(`/menu-templates${params}`);
  }

  async createMenuTemplate(data: {
    name: string;
    description?: string;
    currency?: string;
    location_id?: number;
    settings?: any;
  }): Promise<ApiResponse> {
    return this.request('/menu-templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMenuTemplate(templateId: number): Promise<ApiResponse> {
    return this.request(`/menu-templates/${templateId}`);
  }

  async updateMenuTemplate(templateId: number, data: any): Promise<ApiResponse> {
    return this.request(`/menu-templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMenuTemplate(templateId: number): Promise<ApiResponse> {
    return this.request(`/menu-templates/${templateId}`, {
      method: 'DELETE',
    });
  }

  async duplicateMenuTemplate(templateId: number, data: { name: string }): Promise<ApiResponse> {
    return this.request(`/menu-templates/${templateId}/duplicate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Template Categories
  async createTemplateCategory(templateId: number, data: {
    name: string;
    description?: string;
    icon?: string;
  }): Promise<ApiResponse> {
    return this.request(`/menu-templates/${templateId}/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTemplateCategory(templateId: number, categoryId: number, data: any): Promise<ApiResponse> {
    return this.request(`/menu-templates/${templateId}/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTemplateCategory(templateId: number, categoryId: number): Promise<ApiResponse> {
    return this.request(`/menu-templates/${templateId}/categories/${categoryId}`, {
      method: 'DELETE',
    });
  }

  async reorderTemplateCategories(templateId: number, data: { categories: { id: number; sort_order: number }[] }): Promise<ApiResponse> {
    return this.request(`/menu-templates/${templateId}/categories/reorder`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Template Items
  async createTemplateItem(templateId: number, categoryId: number, data: {
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    icon?: string;
  }): Promise<ApiResponse> {
    return this.request(`/menu-templates/${templateId}/categories/${categoryId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTemplateItem(templateId: number, itemId: number, data: any): Promise<ApiResponse> {
    return this.request(`/menu-templates/${templateId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTemplateItem(templateId: number, itemId: number): Promise<ApiResponse> {
    return this.request(`/menu-templates/${templateId}/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  async bulkCreateTemplateItems(templateId: number, data: { items: any[] }): Promise<ApiResponse> {
    return this.request(`/menu-templates/${templateId}/items/bulk`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Menu Endpoints (Tables, Rooms, Branches)
  async getMenuEndpoints(params?: {
    location_id?: number;
    template_id?: number;
    type?: string;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (params?.location_id) queryParams.append('location_id', params.location_id.toString());
    if (params?.template_id) queryParams.append('template_id', params.template_id.toString());
    if (params?.type) queryParams.append('type', params.type);
    const query = queryParams.toString();
    return this.request(`/menu-endpoints${query ? `?${query}` : ''}`);
  }

  async createMenuEndpoint(data: {
    template_id: number;
    type: 'table' | 'room' | 'area' | 'branch' | 'kiosk' | 'takeaway' | 'event' | 'delivery';
    name: string;
    identifier?: string;
    description?: string;
    location_id?: number;
    settings?: any;
  }): Promise<ApiResponse> {
    return this.request('/menu-endpoints', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMenuEndpoint(endpointId: number): Promise<ApiResponse> {
    return this.request(`/menu-endpoints/${endpointId}`);
  }

  async updateMenuEndpoint(endpointId: number, data: any): Promise<ApiResponse> {
    return this.request(`/menu-endpoints/${endpointId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMenuEndpoint(endpointId: number): Promise<ApiResponse> {
    return this.request(`/menu-endpoints/${endpointId}`, {
      method: 'DELETE',
    });
  }

  async bulkCreateMenuEndpoints(data: {
    template_id: number;
    type: string;
    prefix: string;
    start_number: number;
    count: number;
    location_id?: number;
  }): Promise<ApiResponse> {
    return this.request('/menu-endpoints/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getEndpointQRCode(endpointId: number, params?: {
    size?: number;
    format?: 'png' | 'svg';
    color?: string;
    background?: string;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (params?.size) queryParams.append('size', params.size.toString());
    if (params?.format) queryParams.append('format', params.format);
    if (params?.color) queryParams.append('color', params.color);
    if (params?.background) queryParams.append('background', params.background);
    const query = queryParams.toString();
    return this.request(`/menu-endpoints/${endpointId}/qr${query ? `?${query}` : ''}`);
  }

  async regenerateEndpointQR(endpointId: number): Promise<ApiResponse> {
    return this.request(`/menu-endpoints/${endpointId}/regenerate-qr`, {
      method: 'POST',
    });
  }

  // Endpoint Overrides
  async getEndpointOverrides(endpointId: number): Promise<ApiResponse> {
    return this.request(`/menu-endpoints/${endpointId}/overrides`);
  }

  async createEndpointOverride(endpointId: number, data: {
    item_id: number;
    price_override?: number;
    is_available?: boolean;
    is_hidden?: boolean;
  }): Promise<ApiResponse> {
    return this.request(`/menu-endpoints/${endpointId}/overrides`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteEndpointOverride(endpointId: number, itemId: number): Promise<ApiResponse> {
    return this.request(`/menu-endpoints/${endpointId}/overrides/${itemId}`, {
      method: 'DELETE',
    });
  }

  async bulkUpdateEndpointOverrides(endpointId: number, data: { overrides: any[] }): Promise<ApiResponse> {
    return this.request(`/menu-endpoints/${endpointId}/overrides/bulk`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getEndpointAnalytics(endpointId: number, params?: { days?: number }): Promise<ApiResponse> {
    const query = params?.days ? `?days=${params.days}` : '';
    return this.request(`/menu-endpoints/${endpointId}/analytics${query}`);
  }

  // Menu Offers
  async getMenuOffers(params?: {
    template_id?: number;
    location_id?: number;
    type?: string;
    active_only?: boolean;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (params?.template_id) queryParams.append('template_id', params.template_id.toString());
    if (params?.location_id) queryParams.append('location_id', params.location_id.toString());
    if (params?.type) queryParams.append('type', params.type);
    if (params?.active_only) queryParams.append('active_only', 'true');
    const query = queryParams.toString();
    return this.request(`/menu-offers${query ? `?${query}` : ''}`);
  }

  async createMenuOffer(data: {
    template_id: number;
    name: string;
    type: 'special' | 'instant' | 'seasonal' | 'combo' | 'happy_hour';
    discount_type?: 'percentage' | 'fixed' | 'bogo';
    discount_value?: number;
    description?: string;
    starts_at?: string;
    ends_at?: string;
    item_ids?: number[];
    category_ids?: number[];
  }): Promise<ApiResponse> {
    return this.request('/menu-offers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMenuOffer(offerId: number, data: any): Promise<ApiResponse> {
    return this.request(`/menu-offers/${offerId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMenuOffer(offerId: number): Promise<ApiResponse> {
    return this.request(`/menu-offers/${offerId}`, {
      method: 'DELETE',
    });
  }

  async toggleMenuOffer(offerId: number): Promise<ApiResponse> {
    return this.request(`/menu-offers/${offerId}/toggle`, {
      method: 'POST',
    });
  }

  async duplicateMenuOffer(offerId: number, data: { name: string }): Promise<ApiResponse> {
    return this.request(`/menu-offers/${offerId}/duplicate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Public Menu APIs (for fetching menu by short code)
  async getPublicMenu(shortCode: string): Promise<ApiResponse> {
    return this.request(`/public/menu/endpoint/${shortCode}`);
  }

  async getPublicMenuData(shortCode: string): Promise<ApiResponse> {
    return this.request(`/menu/${shortCode}/data`);
  }

  async getPublicMenuOffers(shortCode: string): Promise<ApiResponse> {
    return this.request(`/menu/${shortCode}/offers`);
  }

  async recordMenuScan(shortCode: string): Promise<ApiResponse> {
    return this.request(`/menu/${shortCode}/scan`, {
      method: 'POST',
    });
  }

  // Generic HTTP methods for direct API access
  async get<T = any>(endpoint: string): Promise<{ data: ApiResponse<T> }> {
    const response = await this.request<T>(endpoint, { method: 'GET' });
    return { data: response };
  }

  async post<T = any>(endpoint: string, data?: any): Promise<{ data: ApiResponse<T> }> {
    // Handle FormData specially (for file uploads)
    if (data instanceof FormData) {
      const response = await this.request<T>(endpoint, {
        method: 'POST',
        body: data,
        skipJsonContentType: true, // Signal to skip JSON content-type header
      });
      return { data: response };
    }
    
    const response = await this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    return { data: response };
  }

  async put<T = any>(endpoint: string, data?: any): Promise<{ data: ApiResponse<T> }> {
    const response = await this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    return { data: response };
  }

  async delete<T = any>(endpoint: string): Promise<{ data: ApiResponse<T> }> {
    const response = await this.request<T>(endpoint, { method: 'DELETE' });
    return { data: response };
  }
}

export const apiClient = new ApiClient();
// Alias for simpler import: import { api } from '@/lib/api'
export const api = apiClient;
export type { User, AuthData, ApiResponse, UserContext };