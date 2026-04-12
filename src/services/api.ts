// API configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Types for API responses
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'staff' | 'admin';
  created_at: string;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
  category: string;
}

export interface Staff {
  id: number;
  name: string;
  email: string;
  specialty: string;
  rating: number;
  is_available: boolean;
}

export interface Appointment {
  id: number;
  customer_id: number;
  staff_id: number;
  service_id: number;
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
  service_id: number;
  staff_id: number;
  appointment_date: string;
  appointment_time: string;
  notes?: string;
}

// API utility functions
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
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
    await apiRequest('/auth/logout', { method: 'POST' });
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }
};

// Services API
export const servicesAPI = {
  async getAll(): Promise<Service[]> {
    return apiRequest<Service[]>('/services');
  },

  async getById(id: number): Promise<Service> {
    return apiRequest<Service>(`/services/${id}`);
  },

  async create(service: Omit<Service, 'id'>): Promise<Service> {
    return apiRequest<Service>('/services', {
      method: 'POST',
      body: JSON.stringify(service),
    });
  },

  async update(id: number, service: Partial<Service>): Promise<Service> {
    return apiRequest<Service>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(service),
    });
  },

  async delete(id: number): Promise<void> {
    await apiRequest(`/services/${id}`, { method: 'DELETE' });
  },

  async assignStaff(serviceId: number, staffId: number): Promise<void> {
    await apiRequest(`/staff/${staffId}/assign-service`, {
      method: 'POST',
      body: JSON.stringify({ service_id: serviceId }),
    });
  },

  async removeStaff(serviceId: number, staffId: number): Promise<void> {
    await apiRequest(`/staff/${staffId}/remove-service`, {
      method: 'DELETE',
      body: JSON.stringify({ service_id: serviceId }),
    });
  }
};

// Staff API
export const staffAPI = {
  async getAll(): Promise<Staff[]> {
    return apiRequest<Staff[]>('/staff');
  },

  async getById(id: number): Promise<Staff> {
    return apiRequest<Staff>(`/staff/${id}`);
  },

  async getAvailable(date: string, serviceId: number): Promise<Staff[]> {
    return apiRequest<Staff[]>(`/staff/available?date=${date}&service_id=${serviceId}`);
  },

  async create(staff: Omit<Staff, 'id'>): Promise<Staff> {
    return apiRequest<Staff>('/staff', {
      method: 'POST',
      body: JSON.stringify(staff),
    });
  },

  async update(id: number, staff: Partial<Staff>): Promise<Staff> {
    return apiRequest<Staff>(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(staff),
    });
  },

  async delete(id: number): Promise<void> {
    await apiRequest(`/staff/${id}`, { method: 'DELETE' });
  },

  async getAssignments(): Promise<Array<{
    id: number;
    name: string;
    email: string;
    phone: string;
    role: string;
    specialty: string;
    status: string;
    rating: number;
    service_ids: number[];
  }>> {
    return apiRequest<Array<any>>('/staff-assignments');
  }
};

// Appointments API
export const appointmentsAPI = {
  async getAll(): Promise<Appointment[]> {
    return apiRequest<Appointment[]>('/appointments');
  },

  async getById(id: number): Promise<Appointment> {
    return apiRequest<Appointment>(`/appointments/${id}`);
  },

  async getByCustomer(customerId: number): Promise<Appointment[]> {
    return apiRequest<Appointment[]>(`/appointments/customer/${customerId}`);
  },

  async getByStaff(staffId: number): Promise<Appointment[]> {
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

  async update(id: number, updates: Partial<Appointment>): Promise<Appointment> {
    return apiRequest<Appointment>(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async updateStatus(id: number, status: Appointment['status']): Promise<Appointment> {
    return apiRequest<Appointment>(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async cancel(id: number): Promise<void> {
    await apiRequest(`/appointments/${id}/cancel`, { method: 'PATCH' });
  },

  async delete(id: number): Promise<void> {
    await apiRequest(`/appointments/${id}`, { method: 'DELETE' });
  },

  async getAvailableSlots(date: string, serviceId: number, staffId?: number): Promise<string[]> {
    const params = new URLSearchParams({
      date,
      service_id: serviceId.toString(),
      ...(staffId && { staff_id: staffId.toString() })
    });
    return apiRequest<string[]>(`/appointments/available-slots?${params}`);
  },

  // Admin-specific appointment management
  async getAllForAdmin(params?: {
    status?: string;
    date?: string;
    staff_id?: number;
    service_id?: number;
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

  async updateStatusAdmin(id: number, status: Appointment['status'], notes?: string): Promise<void> {
    await apiRequest(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },

  async rescheduleAdmin(id: number, updates: {
    appointment_date?: string;
    appointment_time?: string;
    staff_id?: number;
    notes?: string;
  }): Promise<void> {
    await apiRequest(`/appointments/${id}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deleteAdmin(id: number, reason?: string): Promise<void> {
    await apiRequest(`/appointments/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
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

// Mock data for development (when Flask backend is not available)
export const mockAPI = {
  auth: {
    async login(credentials: LoginRequest) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock users with different roles based on email
      const mockUsers: { [key: string]: User } = {
        'customer@example.com': {
          id: 1,
          name: 'John Customer',
          email: 'customer@example.com',
          role: 'customer',
          created_at: new Date().toISOString()
        },
        'staff@example.com': {
          id: 2,
          name: 'Sarah Staff',
          email: 'staff@example.com',
          role: 'staff',
          created_at: new Date().toISOString()
        },
        'admin@example.com': {
          id: 3,
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
          created_at: new Date().toISOString()
        }
      };
      
      // Find user by email or create a customer by default
      const mockUser = mockUsers[credentials.email] || {
        id: 1,
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
        id: Date.now(), // Use timestamp as mock ID
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
    }
  },

  services: {
    async getAll(): Promise<Service[]> {
      return [
        { id: 1, name: 'Hair Cut & Style', description: 'Professional cuts, coloring, and styling', duration: 60, price: 85, category: 'Hair' },
        { id: 2, name: 'Hair Coloring', description: 'Professional hair coloring service', duration: 120, price: 150, category: 'Hair' },
        { id: 3, name: 'Signature Facial', description: 'Rejuvenating facial care and treatments', duration: 75, price: 120, category: 'Facial' },
        { id: 4, name: 'Gel Manicure', description: 'Professional manicure with gel polish', duration: 45, price: 65, category: 'Nails' },
        { id: 5, name: 'Spa Pedicure', description: 'Relaxing pedicure treatment', duration: 60, price: 75, category: 'Nails' },
        { id: 6, name: 'Relaxing Massage', description: 'Full body relaxation massage', duration: 90, price: 180, category: 'Massage' }
      ];
    },

    async create(service: Omit<Service, 'id'>): Promise<Service> {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newService = { id: Date.now(), ...service };
      return newService;
    },

    async update(id: number, service: Partial<Service>): Promise<Service> {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { id, ...service } as Service;
    },

    async delete(id: number): Promise<void> {
      await new Promise(resolve => setTimeout(resolve, 500));
    },

    async assignStaff(serviceId: number, staffId: number): Promise<void> {
      await new Promise(resolve => setTimeout(resolve, 500));
    },

    async removeStaff(serviceId: number, staffId: number): Promise<void> {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  },

  staff: {
    async getAll(): Promise<Staff[]> {
      return [
        { id: 1, name: 'Sarah Johnson', email: 'sarah@salon.com', specialty: 'Hair Styling', rating: 4.9, is_available: true },
        { id: 2, name: 'Emma Wilson', email: 'emma@salon.com', specialty: 'Facial Treatments', rating: 4.8, is_available: true },
        { id: 3, name: 'Lisa Chen', email: 'lisa@salon.com', specialty: 'Nail Care', rating: 4.7, is_available: true },
        { id: 4, name: 'Any Available Staff', email: 'staff@salon.com', specialty: 'All Services', rating: 4.8, is_available: true }
      ];
    },

    async getAssignments() {
      return [
        { id: 1, name: 'Emma Wilson', email: 'emma.wilson@salon.com', phone: '+1 (555) 123-4567', role: 'Senior Stylist', specialty: 'Hair Cutting & Styling', status: 'active', rating: 4.9, service_ids: [1, 2] },
        { id: 2, name: 'Lisa Davis', email: 'lisa.davis@salon.com', phone: '+1 (555) 234-5678', role: 'Hair Stylist', specialty: 'Hair Services', status: 'active', rating: 4.8, service_ids: [1] },
        { id: 3, name: 'Sarah Johnson', email: 'sarah.johnson@salon.com', phone: '+1 (555) 345-6789', role: 'Facial Specialist', specialty: 'Skin Care & Treatments', status: 'active', rating: 4.7, service_ids: [3] },
        { id: 4, name: 'Mike Roberts', email: 'mike.roberts@salon.com', phone: '+1 (555) 456-7890', role: 'Nail Technician', specialty: 'Manicure & Pedicure', status: 'active', rating: 4.6, service_ids: [4, 5] },
        { id: 5, name: 'Carlos Martinez', email: 'carlos.martinez@salon.com', phone: '+1 (555) 567-8901', role: 'Massage Therapist', specialty: 'Relaxation & Therapeutic Massage', status: 'active', rating: 4.8, service_ids: [6] }
      ];
    }
  },

  appointments: {
    async getAll(): Promise<Appointment[]> {
      return [];
    },

    async getByCustomer(customerId: number): Promise<Appointment[]> {
      return [];
    },

    async create(booking: BookingRequest): Promise<Appointment> {
      const mockAppointment: Appointment = {
        id: Date.now(),
        customer_id: 1,
        staff_id: booking.staff_id,
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
        { id: 1, customer: { id: 1, name: 'Sarah Johnson', email: 'sarah.j@email.com', phone: '+1 (555) 111-2222' }, staff: { id: 1, name: 'Emma Wilson', role: 'Senior Stylist' }, service: { id: 1, name: 'Hair Cut & Style', duration: 60 }, appointment_date: '2024-12-20', appointment_time: '10:00', status: 'confirmed', price: 85, notes: 'First time client', created_at: '2024-12-19T10:00:00Z' },
        { id: 2, customer: { id: 2, name: 'Mike Chen', email: 'mike.chen@email.com', phone: '+1 (555) 333-4444' }, staff: { id: 3, name: 'Sarah Johnson', role: 'Facial Specialist' }, service: { id: 3, name: 'Signature Facial', duration: 75 }, appointment_date: '2024-12-20', appointment_time: '14:00', status: 'pending', price: 120, created_at: '2024-12-19T11:00:00Z' },
        { id: 3, customer: { id: 3, name: 'Anna Rodriguez', email: 'anna.r@email.com', phone: '+1 (555) 555-6666' }, staff: { id: 4, name: 'Mike Roberts', role: 'Nail Technician' }, service: { id: 4, name: 'Gel Manicure', duration: 45 }, appointment_date: '2024-12-20', appointment_time: '15:30', status: 'confirmed', price: 65, created_at: '2024-12-19T12:00:00Z' },
        { id: 4, customer: { id: 4, name: 'David Kim', email: 'david.kim@email.com', phone: '+1 (555) 777-8888' }, staff: { id: 1, name: 'Emma Wilson', role: 'Senior Stylist' }, service: { id: 2, name: 'Hair Coloring', duration: 120 }, appointment_date: '2024-12-19', appointment_time: '13:00', status: 'completed', price: 150, created_at: '2024-12-18T14:00:00Z' },
        { id: 5, customer: { id: 5, name: 'Jennifer Lee', email: 'jen.lee@email.com', phone: '+1 (555) 999-0000' }, staff: { id: 5, name: 'Carlos Martinez', role: 'Massage Therapist' }, service: { id: 6, name: 'Relaxing Massage', duration: 90 }, appointment_date: '2024-12-21', appointment_time: '11:00', status: 'pending', price: 180, created_at: '2024-12-19T16:00:00Z' }
      ];

      return {
        appointments: mockAppointments,
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

    async updateStatusAdmin(id: number, status: string, notes?: string): Promise<void> {
      await new Promise(resolve => setTimeout(resolve, 500));
    },

    async rescheduleAdmin(id: number, updates: any): Promise<void> {
      await new Promise(resolve => setTimeout(resolve, 500));
    },

    async deleteAdmin(id: number, reason?: string): Promise<void> {
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
        { id: 1, name: 'Sarah Johnson', role: 'Hair Stylist', appointments: 28, rating: 4.9 },
        { id: 2, name: 'Emma Wilson', role: 'Esthetician', appointments: 22, rating: 4.8 },
        { id: 3, name: 'Lisa Chen', role: 'Nail Technician', appointments: 25, rating: 4.7 },
        { id: 4, name: 'Mike Davis', role: 'Massage Therapist', appointments: 18, rating: 4.6 }
      ];
    },

    async getServicePerformance() {
      return [
        { service_id: 1, service_name: 'Hair Cut & Style', category: 'Hair', base_price: 85, total_bookings: 45, completed_bookings: 42, total_revenue: 3570, average_revenue: 85, completion_rate: 93.3 },
        { service_id: 2, service_name: 'Hair Coloring', category: 'Hair', base_price: 150, total_bookings: 28, completed_bookings: 26, total_revenue: 3900, average_revenue: 150, completion_rate: 92.9 },
        { service_id: 3, service_name: 'Signature Facial', category: 'Facial', base_price: 120, total_bookings: 35, completed_bookings: 33, total_revenue: 3960, average_revenue: 120, completion_rate: 94.3 },
        { service_id: 4, service_name: 'Gel Manicure', category: 'Nails', base_price: 65, total_bookings: 52, completed_bookings: 49, total_revenue: 3185, average_revenue: 65, completion_rate: 94.2 },
        { service_id: 5, service_name: 'Spa Pedicure', category: 'Nails', base_price: 75, total_bookings: 38, completed_bookings: 36, total_revenue: 2700, average_revenue: 75, completion_rate: 94.7 },
        { service_id: 6, service_name: 'Relaxing Massage', category: 'Massage', base_price: 180, total_bookings: 22, completed_bookings: 20, total_revenue: 3600, average_revenue: 180, completion_rate: 90.9 }
      ];
    },

    async getStaffWorkload() {
      return [
        { staff_id: 1, staff_name: 'Emma Wilson', role: 'Senior Stylist', total_appointments: 45, completed_appointments: 42, total_hours: 63, total_revenue: 6300, completion_rate: 93.3 },
        { staff_id: 2, staff_name: 'Lisa Davis', role: 'Hair Stylist', total_appointments: 28, completed_appointments: 26, total_hours: 26, total_revenue: 2210, completion_rate: 92.9 },
        { staff_id: 3, staff_name: 'Sarah Johnson', role: 'Facial Specialist', total_appointments: 35, completed_appointments: 33, total_hours: 41.25, total_revenue: 3960, completion_rate: 94.3 },
        { staff_id: 4, staff_name: 'Mike Roberts', role: 'Nail Technician', total_appointments: 52, completed_appointments: 49, total_hours: 61.25, total_revenue: 3185, completion_rate: 94.2 },
        { staff_id: 5, staff_name: 'Carlos Martinez', role: 'Massage Therapist', total_appointments: 22, completed_appointments: 20, total_hours: 30, total_revenue: 3600, completion_rate: 90.9 }
      ];
    }
  }
};

// Configuration for API usage
// Set this to true when you want to use the real Flask backend
const USE_REAL_API = false;

export const api = USE_REAL_API ? {
  auth: authAPI,
  services: servicesAPI,
  staff: staffAPI,
  appointments: appointmentsAPI,
  analytics: analyticsAPI
} : mockAPI;