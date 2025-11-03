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
  created_at: string;
  updated_at: string;
}

interface AuthData {
  user: User;
  token: string;
  token_type: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Always refresh token from localStorage before making requests
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
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
    return this.request<AuthData>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }): Promise<ApiResponse<AuthData>> {
    return this.request<AuthData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    return this.request('/user');
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
      return await this.request('/business-profile');
    } catch (error: any) {
      // 404 means no business profile exists - this is expected for new users
      if (error.message?.includes('404') || error.message?.includes('Not Found') || error.message?.includes('Business profile not found')) {
        // Don't log this as an error since it's expected for new users
        return {
          success: false,
          message: 'Business profile not found',
          data: { needs_onboarding: true }
        };
      }
      // Only log unexpected errors
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

      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      };

      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      const response = await fetch(`${this.baseURL}/menus/${menuId}/items`, {
        method: 'POST',
        headers,
        body: data,
      });

      const responseData = await response.json();
      console.log('Response status:', response.status);
      console.log('Response data:', responseData);

      if (!response.ok) {
        // Log validation errors
        if (response.status === 422 && responseData.errors) {
          console.error('Validation errors:', responseData.errors);
        }
        
        // Handle subscription limit errors specifically
        if (response.status === 403 && responseData.message?.includes('limit')) {
          // Log additional debugging info
          console.log('Limit error details:', {
            currentItems: responseData.current_items || 'unknown',
            maxItems: responseData.max_items || 'unknown',
            message: responseData.message
          });
          throw new Error(`SUBSCRIPTION_LIMIT: ${responseData.message}`);
        }
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
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
}

export const apiClient = new ApiClient();
export type { User, AuthData, ApiResponse };