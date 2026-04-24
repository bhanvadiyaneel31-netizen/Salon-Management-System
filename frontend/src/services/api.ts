// API configuration
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
export const API_ORIGIN = API_BASE_URL.replace('/api', '');

// Types for API responses
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  profile_image?: string;
  role: 'customer' | 'staff' | 'admin';
  loyalty_points?: number;
  rating?: number;
  review_count?: number;
  created_at: string;
}

export interface LoyaltyHistory {
  id: number;
  user_id: number;
  points: number;
  type: 'earn' | 'redeem';
  reason: string;
  created_at: string;
}

export interface LoyaltySettings {
  id: string;
  points_per_dollar: number;
  redemption_rate: number;
  max_discount_percent: number;
  min_booking_amount: number;
  points_expiry_days: number;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
  category: string;
  is_active?: boolean;
  image_url?: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  specialty: string;
  rating: number;
  is_available: boolean;
}

export interface Appointment {
  id: string;
  customer_id: string;
  staff_id: string;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  price: number;
  customer?: User;
  staff?: Staff;
  service?: Service;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'customer' | 'staff' | 'admin';
}

export interface BookingRequest {
  service_id: string;
  staff_id: string | null;
  appointment_date: string;
  appointment_time: string;
  notes?: string;
  points_redeemed?: number;
  discount_amount?: number;
  reward_id?: string | null;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  appointment_id?: number;
  created_at: string;
}

// API utility functions
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');

  const headers: HeadersInit = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    (headers as any)['Content-Type'] = 'application/json';
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    if (!response.ok) {
      if (isJson) {
        const error = await response.json();
        throw new Error(error.error || error.message || `API Error (${response.status})`);
      } else {
        const text = await response.text();
        if (response.status === 404) {
          throw new Error("Backend route not found. Did you restart the server?");
        }
        throw new Error(`Server Error (${response.status}): ${text.substring(0, 100)}...`);
      }
    }

    if (!isJson) {
      return null as any;
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Real Authentication API (for when Flask backend is available)
export const authAPI = {
  async login(credentials: LoginRequest): Promise<{ user: User; token: string }> {
    const response = await apiRequest<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Store token in localStorage
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));

    return response;
  },

  async register(userData: RegisterRequest): Promise<{ user: User; token: string }> {
    // Enforce customer role on backend - ignore any role sent from frontend
    const secureUserData = {
      ...userData,
      role: 'customer' as const // Always set to customer regardless of frontend input
    };

    const response = await apiRequest<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(secureUserData),
    });

    // Store token in localStorage
    localStorage.setItem('auth_token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));

    return response;
  },

  async logout(): Promise<void> {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // Clear local data even if server call fails
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },

  async updateProfile(profileData: Partial<User>): Promise<User> {
    return usersAPI.update(null, profileData);
  },

  async getProfile(): Promise<User & { total_appointments: number }> {
    // Fetches live data from DB — includes loyalty_points, total_appointments, created_at
    return apiRequest<User & { total_appointments: number }>('/users/me');
  },

  async getMe(): Promise<User> {
    return apiRequest<User>('/auth/me');
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/auth/reset-password/${token}`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }
};


// Users API
export const usersAPI = {
  async update(id: string | null, data: any): Promise<User> {
    const response = await apiRequest<User>('/users/update', {
      method: 'PUT',
      body: JSON.stringify({ id, ...data }),
    });

    // If updating self, update stored user info
    const currentUser = authAPI.getCurrentUser();
    if (!id || (currentUser && id === currentUser.id)) {
      localStorage.setItem('user', JSON.stringify(response));
    }

    return response;
  }
};

export const reportsAPI = {
  async generate(data: {
    reportType: string;
    staffId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    return apiRequest<any>('/reports/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async export(data: {
    format: 'excel' | 'pdf';
    reportType: string;
    staffId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Authentication required for export');

    const response = await fetch(`${API_ORIGIN}/api/reports/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `Export failed (${response.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMsg += `: ${errorJson.error || errorText}`;
      } catch (e) {
        errorMsg += `: ${errorText}`;
      }
      throw new Error(errorMsg);
    }
    return response.blob();
  }
};

// Services API
export const servicesAPI = {
  async getAll(params?: { bookable?: boolean; includeInactive?: boolean }): Promise<Service[]> {
    const queryParams = new URLSearchParams();
    if (params?.bookable) queryParams.append('bookable', 'true');
    if (params?.includeInactive) queryParams.append('include_inactive', 'true');

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiRequest<Service[]>(`/services${query}`);
  },

  async getCategories(): Promise<any[]> {
    return apiRequest<any[]>('/services/categories');
  },

  async getById(id: string): Promise<Service> {
    return apiRequest<Service>(`/services/${id}`);
  },

  async getDetails(id: string): Promise<any> {
    return apiRequest<any>(`/services/${id}/details`);
  },

  async create(data: FormData | any): Promise<Service> {
    return apiRequest<Service>('/services', {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  },

  async update(id: string, data: FormData | any): Promise<Service> {
    return apiRequest<Service>(`/services/${id}`, {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    await apiRequest(`/services/${id}`, { method: 'DELETE' });
  },

};

// Staff API
export const staffAPI = {
  async getAll(): Promise<Staff[]> {
    return apiRequest<Staff[]>('/staff');
  },

  async getById(id: string): Promise<Staff> {
    return apiRequest<Staff>(`/staff/${id}`);
  },

  async getAvailable(date: string, serviceId: string): Promise<Staff[]> {
    return apiRequest<Staff[]>(`/staff/available?date=${date}&service_id=${serviceId}`);
  },

  async getAvailableSlots(date: string, staffId: string, serviceId: string): Promise<string[]> {
    return apiRequest<string[]>(`/appointments/slots?date=${date}&staff_id=${staffId}&service_id=${serviceId}`);
  },

  async create(staff: Omit<Staff, 'id'>): Promise<Staff> {
    return apiRequest<Staff>('/staff', {
      method: 'POST',
      body: JSON.stringify(staff),
    });
  },

  async update(id: string, staff: Partial<Staff>): Promise<Staff> {
    return apiRequest<Staff>(`/staff/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(staff),
    });
  },

  async updateProfile(data: { name?: string; email?: string; phone?: string; password?: string; address?: string; profile_image?: string }): Promise<Staff> {
    return apiRequest<Staff>('/staff/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    await apiRequest(`/staff/${id}`, { method: 'DELETE' });
  },

  async getAssignments(): Promise<Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    specialty: string;
    status: string;
    rating: number;
    service_ids: string[];
  }>> {
    return apiRequest<Array<any>>('/staff-assignments');
  },

  async getRating(id: string): Promise<{ average: number; count: number }> {
    return apiRequest<{ average: number; count: number }>(`/staff/${id}/rating`);
  },

  async assignServices(staffId: string, serviceIds: string[]): Promise<{ id: string; name: string; assigned_service_ids: string[] }> {
    return apiRequest(`/staff/${staffId}/services`, {
      method: 'PATCH',
      body: JSON.stringify({ service_ids: serviceIds }),
    });
  }
};

// Appointments API
export const appointmentsAPI = {
  async getAll(): Promise<Appointment[]> {
    return apiRequest<Appointment[]>('/appointments');
  },

  async getById(id: string): Promise<Appointment> {
    return apiRequest<Appointment>(`/appointments/${id}`);
  },

  async getByCustomer(customerId: string): Promise<Appointment[]> {
    return apiRequest<Appointment[]>(`/appointments/customer/${customerId}`);
  },

  async getByStaff(staffId: string): Promise<Appointment[]> {
    return apiRequest<Appointment[]>(`/appointments/staff/${staffId}`);
  },

  async getByDate(date: string): Promise<Appointment[]> {
    return apiRequest<Appointment[]>(`/appointments/date/${date}`);
  },

  async create(booking: BookingRequest): Promise<Appointment> {
    return apiRequest<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(booking),
    });
  },

  async update(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    return apiRequest<Appointment>(`/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async updateStatus(id: string, status: Appointment['status']): Promise<Appointment> {
    return apiRequest<Appointment>(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async cancel(id: string): Promise<void> {
    await apiRequest(`/appointments/${id}/cancel`, { method: 'PATCH' });
  },

  async delete(id: string): Promise<void> {
    await apiRequest(`/appointments/${id}`, { method: 'DELETE' });
  },

  async getAvailableSlots(date: string, staffId: string, serviceId: string, excludeAppointmentId?: string): Promise<string[]> {
    const params = new URLSearchParams({
      date,
      staff_id: staffId.toString(),
      service_id: serviceId.toString()
    });
    if (excludeAppointmentId) {
      params.append('exclude_appointment_id', excludeAppointmentId.toString());
    }
    return apiRequest<string[]>(`/appointments/slots?${params}`);
  },


  // Admin-specific appointment management
  async getAllForAdmin(params?: {
    status?: string;
    date?: string;
    staff_id?: string;
    service_id?: string;
    page?: number;
    per_page?: number;
  }): Promise<{
    appointments: Appointment[];
    pagination: {
      page: number;
      per_page: number;
      total: number;
      pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    return apiRequest<any>(`/appointments/manage?${queryParams}`);
  },

  async updateStatusAdmin(id: string, status: string, notes?: string): Promise<void> {
    await apiRequest(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },

  async rescheduleAdmin(id: string, updates: {
    appointment_date?: string;
    appointment_time?: string;
    staff_id?: string;
    notes?: string;
  }): Promise<void> {
    await apiRequest(`/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deleteAdmin(id: string, reason?: string): Promise<void> {
    await apiRequest(`/appointments/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    });
  },

  async submitReview(id: string, rating: number, review: string): Promise<void> {
    await apiRequest(`/appointments/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ rating, review }),
    });
  },

  async reschedule(id: string, date: string, time: string): Promise<void> {
    await apiRequest(`/appointments/${id}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify({ newDate: date, newTime: time }),
    });
  }

};

// Analytics API (for admin dashboard)
export const analyticsAPI = {
  async getDashboardStats(): Promise<{
    todayAppointments: number;
    todayRevenue: number;
    activeStaff: number;
    growthRate: number;
  }> {
    return apiRequest('/analytics/dashboard-stats');
  },

  async getWeeklyData(): Promise<Array<{
    day: string;
    appointments: number;
    revenue: number;
  }>> {
    return apiRequest('/analytics/weekly-data');
  },

  async getServiceDistribution(): Promise<Array<{
    name: string;
    value: number;
    color: string;
  }>> {
    return apiRequest('/analytics/service-distribution');
  },

  async getMonthlyRevenue(): Promise<Array<{
    month: string;
    appointments: number;
    revenue: number;
  }>> {
    return apiRequest('/analytics/monthly-revenue');
  },

  async getStaffPerformance(): Promise<Array<{
    id: number;
    name: string;
    role: string;
    appointments: number;
    rating: number;
  }>> {
    return apiRequest('/analytics/staff-performance');
  },

  async getServicePerformance(): Promise<Array<{
    service_id: number;
    service_name: string;
    category: string;
    base_price: number;
    total_bookings: number;
    completed_bookings: number;
    total_revenue: number;
    average_revenue: number;
    completion_rate: number;
  }>> {
    return apiRequest('/analytics/service-performance');
  },

  async getStaffWorkload(): Promise<Array<{
    staff_id: number;
    staff_name: string;
    role: string;
    total_appointments: number;
    completed_appointments: number;
    total_hours: number;
    total_revenue: number;
    completion_rate: number;
  }>> {
    return apiRequest('/analytics/staff-workload');
  }
};

// Notifications API
export const notificationsAPI = {
  async getAll(): Promise<Notification[]> {
    return apiRequest<Notification[]>('/notifications');
  },

  async getUnreadCount(): Promise<{ count: number }> {
    return apiRequest<{ count: number }>('/notifications/unread-count');
  },

  async markAsRead(id: string): Promise<void> {
    await apiRequest(`/notifications/${id}/read`, { method: 'PUT' });
  },

  async markAllRead(): Promise<void> {
    await apiRequest('/notifications/read-all', { method: 'POST' });
  }
};

// Reviews API
export const reviewsAPI = {
  async getStaffReviews(staffId?: string): Promise<any[]> {
    const query = staffId ? `?staff_id=${staffId}` : '';
    return apiRequest<any[]>(`/reviews/staff${query}`);
  }
};

// Mock data for development (when Flask backend is not available)
export const mockAPI = {
  auth: {
    async login(credentials: LoginRequest) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock users with different roles based on email
      const mockUsers: { [key: string]: User } = {
        'customer@example.com': {
          id: '1',
          name: 'John Customer',
          email: 'customer@example.com',
          role: 'customer',
          created_at: new Date().toISOString()
        },
        'staff@example.com': {
          id: '2',
          name: 'Sarah Staff',
          email: 'staff@example.com',
          role: 'staff',
          created_at: new Date().toISOString()
        },
        'admin@example.com': {
          id: '3',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
          created_at: new Date().toISOString()
        }
      };

      // Find user by email or create a customer by default
      const mockUser = mockUsers[credentials.email] || {
        id: '1',
        name: 'John Doe',
        email: credentials.email,
        role: 'customer' as const,
        created_at: new Date().toISOString()
      };

      // Store mock token and user
      localStorage.setItem('auth_token', 'mock-jwt-token-' + Date.now());
      localStorage.setItem('user', JSON.stringify(mockUser));

      return {
        user: mockUser,
        token: 'mock-jwt-token-' + Date.now()
      };
    },

    async register(userData: RegisterRequest) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockUser: User = {
        id: String(Date.now()), // Use timestamp as mock ID
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: 'customer', // Always enforce customer role, ignore frontend input
        created_at: new Date().toISOString()
      };

      // Store mock token and user
      localStorage.setItem('auth_token', 'mock-jwt-token-' + Date.now());
      localStorage.setItem('user', JSON.stringify(mockUser));

      return {
        user: mockUser,
        token: 'mock-jwt-token-' + Date.now()
      };
    },

    async logout() {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    },

    getCurrentUser(): User | null {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated(): boolean {
      return !!localStorage.getItem('auth_token');
    },

    async getProfile(): Promise<User & { total_appointments: number }> {
      const user = mockAPI.auth.getCurrentUser();
      if (!user) throw new Error('Not authenticated');
      return { ...user, total_appointments: 5 };
    },

    async getMe(): Promise<User> {
      const user = mockAPI.auth.getCurrentUser();
      if (!user) throw new Error('Not authenticated');
      return user;
    }
  },

  users: {
    async update(id: string | null, data: any): Promise<User> {
      await new Promise(resolve => setTimeout(resolve, 500));
      const user = id ? { id, name: 'Mock User', email: 'mock@example.com', role: 'staff' as const, created_at: '' } : mockAPI.auth.getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const updatedUser = { ...user, ...data };
      if (!id || id === user.id) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      return updatedUser;
    }
  },

  services: {
    async getAll(): Promise<Service[]> {
      return [
        { id: '1', name: 'Hair Cut & Style', description: 'Professional cuts, coloring, and styling', duration: 60, price: 85, category: 'Hair' },
        { id: '2', name: 'Hair Coloring', description: 'Professional hair coloring service', duration: 120, price: 150, category: 'Hair' },
        { id: '3', name: 'Signature Facial', description: 'Rejuvenating facial care and treatments', duration: 75, price: 120, category: 'Facial' },
        { id: '4', name: 'Gel Manicure', description: 'Professional manicure with gel polish', duration: 45, price: 65, category: 'Nails' },
        { id: '5', name: 'Spa Pedicure', description: 'Relaxing pedicure treatment', duration: 60, price: 75, category: 'Nails' },
        { id: '6', name: 'Relaxing Massage', description: 'Full body relaxation massage', duration: 90, price: 180, category: 'Massage' }
      ];
    },

    async create(service: Omit<Service, 'id'>): Promise<Service> {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newService = { id: String(Date.now()), ...service };
      return newService as Service;
    },

    async update(id: string, service: Partial<Service>): Promise<Service> {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { id, ...service } as Service;
    },

    async delete(id: string): Promise<void> {
      await new Promise(resolve => setTimeout(resolve, 500));
    },

    async assignStaff(serviceId: string, staffId: string): Promise<void> {
      await new Promise(resolve => setTimeout(resolve, 500));
    },

    async removeStaff(serviceId: string, staffId: string): Promise<void> {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  },

  staff: {
    async getAll(): Promise<Staff[]> {
      return [
        { id: '1', name: 'Sarah Johnson', email: 'sarah@salon.com', specialty: 'Hair Styling', rating: 4.9, is_available: true },
        { id: '2', name: 'Emma Wilson', email: 'emma@salon.com', specialty: 'Facial Treatments', rating: 4.8, is_available: true },
        { id: '3', name: 'Lisa Chen', email: 'lisa@salon.com', specialty: 'Nail Care', rating: 4.7, is_available: true },
        { id: '4', name: 'Any Available Staff', email: 'staff@salon.com', specialty: 'All Services', rating: 4.8, is_available: true }
      ];
    },

    async getAssignments() {
      return [
        { id: '1', name: 'Emma Wilson', email: 'emma.wilson@salon.com', phone: '+1 (555) 123-4567', role: 'Senior Stylist', specialty: 'Hair Cutting & Styling', status: 'active', rating: 4.9, service_ids: ['1', '2'] },
        { id: '2', name: 'Lisa Davis', email: 'lisa.davis@salon.com', phone: '+1 (555) 234-5678', role: 'Hair Stylist', specialty: 'Hair Services', status: 'active', rating: 4.8, service_ids: ['1'] },
        { id: '3', name: 'Sarah Johnson', email: 'sarah.johnson@salon.com', phone: '+1 (555) 345-6789', role: 'Facial Specialist', specialty: 'Skin Care & Treatments', status: 'active', rating: 4.7, service_ids: ['3'] },
        { id: '4', name: 'Mike Roberts', email: 'mike.roberts@salon.com', phone: '+1 (555) 456-7890', role: 'Nail Technician', specialty: 'Manicure & Pedicure', status: 'active', rating: 4.6, service_ids: ['4', '5'] },
        { id: '5', name: 'Carlos Martinez', email: 'carlos.martinez@salon.com', phone: '+1 (555) 567-8901', role: 'Massage Therapist', specialty: 'Relaxation & Therapeutic Massage', status: 'active', rating: 4.8, service_ids: ['6'] }
      ];
    }
  },

  appointments: {
    async getAll(): Promise<Appointment[]> {
      return [];
    },

    async getByCustomer(customerId: string): Promise<Appointment[]> {
      return [];
    },

    async create(booking: BookingRequest): Promise<Appointment> {
      const mockAppointment: Appointment = {
        id: String(Date.now()),
        customer_id: '1',
        staff_id: booking.staff_id || '1',
        service_id: booking.service_id,
        appointment_date: booking.appointment_date,
        appointment_time: booking.appointment_time,
        status: 'pending',
        notes: booking.notes,
        price: 100, // Mock price
      };
      return mockAppointment;
    },

    async getAllForAdmin() {
      const mockAppointments = [
        { id: '1', customer: { id: '1', name: 'Sarah Johnson', email: 'sarah.j@email.com', phone: '+1 (555) 111-2222' }, staff: { id: '1', name: 'Emma Wilson', role: 'Senior Stylist' }, service: { id: '1', name: 'Hair Cut & Style', duration: 60 }, appointment_date: '2024-12-20', appointment_time: '10:00', status: 'confirmed', price: 85, notes: 'First time client', created_at: '2024-12-19T10:00:00Z' },
        { id: '2', customer: { id: '2', name: 'Mike Chen', email: 'mike.chen@email.com', phone: '+1 (555) 333-4444' }, staff: { id: '3', name: 'Sarah Johnson', role: 'Facial Specialist' }, service: { id: '3', name: 'Signature Facial', duration: 75 }, appointment_date: '2024-12-20', appointment_time: '14:00', status: 'pending', price: 120, created_at: '2024-12-19T11:00:00Z' },
        { id: '3', customer: { id: '3', name: 'Anna Rodriguez', email: 'anna.r@email.com', phone: '+1 (555) 555-6666' }, staff: { id: '4', name: 'Mike Roberts', role: 'Nail Technician' }, service: { id: '4', name: 'Gel Manicure', duration: 45 }, appointment_date: '2024-12-20', appointment_time: '15:30', status: 'confirmed', price: 65, created_at: '2024-12-19T12:00:00Z' },
        { id: '4', customer: { id: '4', name: 'David Kim', email: 'david.kim@email.com', phone: '+1 (555) 777-8888' }, staff: { id: '1', name: 'Emma Wilson', role: 'Senior Stylist' }, service: { id: '2', name: 'Hair Coloring', duration: 120 }, appointment_date: '2024-12-19', appointment_time: '13:00', status: 'completed', price: 150, created_at: '2024-12-18T14:00:00Z' },
        { id: '5', customer: { id: '5', name: 'Jennifer Lee', email: 'jen.lee@email.com', phone: '+1 (555) 999-0000' }, staff: { id: '5', name: 'Carlos Martinez', role: 'Massage Therapist' }, service: { id: '6', name: 'Relaxing Massage', duration: 90 }, appointment_date: '2024-12-21', appointment_time: '11:00', status: 'pending', price: 180, created_at: '2024-12-19T16:00:00Z' }
      ];

      return {
        appointments: mockAppointments as any,
        pagination: {
          page: 1,
          per_page: 50,
          total: mockAppointments.length,
          pages: 1,
          has_next: false,
          has_prev: false
        }
      };
    },

    async updateStatusAdmin(id: string, status: string, notes?: string): Promise<void> {
      await new Promise(resolve => setTimeout(resolve, 500));
    },

    async rescheduleAdmin(id: string, updates: any): Promise<void> {
      await new Promise(resolve => setTimeout(resolve, 500));
    },

    async deleteAdmin(id: string, reason?: string): Promise<void> {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  },

  analytics: {
    async getDashboardStats() {
      return {
        todayAppointments: 12,
        todayRevenue: 1480,
        activeStaff: 8,
        growthRate: 15.2
      };
    },

    async getWeeklyData() {
      return [
        { day: 'Mon', appointments: 8, revenue: 920 },
        { day: 'Tue', appointments: 12, revenue: 1340 },
        { day: 'Wed', appointments: 10, revenue: 1150 },
        { day: 'Thu', appointments: 15, revenue: 1680 },
        { day: 'Fri', appointments: 18, revenue: 2100 },
        { day: 'Sat', appointments: 22, revenue: 2750 },
        { day: 'Sun', appointments: 14, revenue: 1890 }
      ];
    },

    async getServiceDistribution() {
      return [
        { name: 'Hair Services', value: 45, color: '#8b5cf6' },
        { name: 'Facial Treatments', value: 25, color: '#ec4899' },
        { name: 'Nail Care', value: 20, color: '#06b6d4' },
        { name: 'Massage', value: 10, color: '#10b981' }
      ];
    },

    async getStaffPerformance() {
      return [
        { id: '1', name: 'Sarah Johnson', role: 'Hair Stylist', appointments: 28, rating: 4.9 },
        { id: '2', name: 'Emma Wilson', role: 'Esthetician', appointments: 22, rating: 4.8 },
        { id: '3', name: 'Lisa Chen', role: 'Nail Technician', appointments: 25, rating: 4.7 },
        { id: '4', name: 'Mike Davis', role: 'Massage Therapist', appointments: 18, rating: 4.6 }
      ];
    },

    async getServicePerformance() {
      return [
        { service_id: '1', service_name: 'Hair Cut & Style', category: 'Hair', base_price: 85, total_bookings: 45, completed_bookings: 42, total_revenue: 3570, average_revenue: 85, completion_rate: 93.3 },
        { service_id: '2', service_name: 'Hair Coloring', category: 'Hair', base_price: 150, total_bookings: 28, completed_bookings: 26, total_revenue: 3900, average_revenue: 150, completion_rate: 92.9 },
        { service_id: '3', service_name: 'Signature Facial', category: 'Facial', base_price: 120, total_bookings: 35, completed_bookings: 33, total_revenue: 3960, average_revenue: 120, completion_rate: 94.3 },
        { service_id: '4', service_name: 'Gel Manicure', category: 'Nails', base_price: 65, total_bookings: 52, completed_bookings: 49, total_revenue: 3185, average_revenue: 65, completion_rate: 94.2 },
        { service_id: '5', service_name: 'Spa Pedicure', category: 'Nails', base_price: 75, total_bookings: 38, completed_bookings: 36, total_revenue: 2700, average_revenue: 75, completion_rate: 94.7 },
        { service_id: '6', service_name: 'Relaxing Massage', category: 'Massage', base_price: 180, total_bookings: 22, completed_bookings: 20, total_revenue: 3600, average_revenue: 180, completion_rate: 90.9 }
      ];
    },

    async getStaffWorkload() {
      return [
        { staff_id: '1', staff_name: 'Emma Wilson', role: 'Senior Stylist', total_appointments: 45, completed_appointments: 42, total_hours: 63, total_revenue: 6300, completion_rate: 93.3 },
        { staff_id: '2', staff_name: 'Lisa Davis', role: 'Hair Stylist', total_appointments: 28, completed_appointments: 26, total_hours: 26, total_revenue: 2210, completion_rate: 92.9 },
        { staff_id: '3', staff_name: 'Sarah Johnson', role: 'Facial Specialist', total_appointments: 35, completed_appointments: 33, total_hours: 41.25, total_revenue: 3960, completion_rate: 94.3 },
        { staff_id: '4', staff_name: 'Mike Roberts', role: 'Nail Technician', total_appointments: 52, completed_appointments: 49, total_hours: 61.25, total_revenue: 3185, completion_rate: 94.2 },
        { staff_id: '5', staff_name: 'Carlos Martinez', role: 'Massage Therapist', total_appointments: 22, completed_appointments: 20, total_hours: 30, total_revenue: 3600, completion_rate: 90.9 }
      ];
    }
  },

  notifications: {
    async getAll(): Promise<Notification[]> {
      return [];
    },
    async markAsRead(): Promise<void> { },
    async markAllRead(): Promise<void> { }
  },

  loyalty: {
    async getHistory(): Promise<LoyaltyHistory[]> {
      return [];
    },
    async getSettings(): Promise<LoyaltySettings> {
      return { id: '1', points_per_dollar: 1, redemption_rate: 0.1, max_discount_percent: 20, min_booking_amount: 50, points_expiry_days: 365, updated_at: new Date().toISOString() };
    },
    async updateSettings(settings: any) {
      return { message: 'Settings updated' };
    },
    async getRewards(): Promise<any[]> {
      return [];
    },
    async addReward(reward: any) {
      return { message: 'Reward added' };
    },
    async updateReward(id: number, reward: any) {
      return { message: 'Reward updated' };
    },
    async deleteReward(id: number) {
      return { message: 'Reward deleted' };
    },
    async adjust(data: any) {
      return { message: 'Points adjusted' };
    }
  },

  reports: {
    async generate(data: any) {
      return { data: [], summary: {} };
    },
    async export(data: any) {
      return new Blob();
    }
  },

  reviews: {
    async getStaffReviews(staffId?: string) {
      return [];
    }
  }
};

// Configuration for API usage
// Set VITE_USE_REAL_API=false in your .env to use mock data during local development
const USE_REAL_API = import.meta.env.PROD || import.meta.env.VITE_USE_REAL_API !== 'false';

export const loyaltyAPI = {
  async getHistory(): Promise<LoyaltyHistory[]> {
    return apiRequest<LoyaltyHistory[]>('/loyalty/history');
  },

  async getSettings(): Promise<LoyaltySettings & { points_expiry_days: number }> {
    return apiRequest<LoyaltySettings & { points_expiry_days: number }>('/loyalty/settings');
  },

  async updateSettings(settings: Partial<LoyaltySettings & { points_expiry_days: number }>): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/loyalty/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings)
    });
  },

  async getRewards(): Promise<any[]> {
    return apiRequest<any[]>('/loyalty/rewards');
  },

  async addReward(reward: { title: string, description?: string, points_required: number }): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/loyalty/rewards', {
      method: 'POST',
      body: JSON.stringify(reward)
    });
  },

  async updateReward(id: number, reward: any): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/loyalty/rewards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(reward)
    });
  },

  async deleteReward(id: number): Promise<{ message: string }> {
    return apiRequest<{ message: string }>(`/loyalty/rewards/${id}`, {
      method: 'DELETE'
    });
  },

  async adjust(data: { user_id: number, email?: string, points: number, type: 'earn' | 'redeem', reason?: string, description?: string }): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/loyalty/adjust', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

export const api = USE_REAL_API ? {
  auth: authAPI,
  services: servicesAPI,
  staff: staffAPI,
  appointments: appointmentsAPI,
  analytics: analyticsAPI,
  notifications: notificationsAPI,
  users: usersAPI,
  loyalty: loyaltyAPI,
  reports: reportsAPI,
  reviews: reviewsAPI
} : mockAPI;