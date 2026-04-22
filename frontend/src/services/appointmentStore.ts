// Centralized appointment storage using localStorage
// This allows appointments to be shared across all dashboards (Admin, Staff, Customer)

import { format } from 'date-fns';

export interface AppointmentStore {
  id: string;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  staff_id: number | null;
  staff_name: string | null;
  service_id: number;
  service_name: string;
  service_duration: number;
  service_price: number;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  booked_by: 'customer' | 'admin' | 'staff';
  rating?: number;
  review?: string;
  points_earned?: number;
}

const STORAGE_KEY = 'salon_appointments';

// Get all appointments from localStorage
export function getAllAppointments(): AppointmentStore[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error parsing appointments:', error);
    return [];
  }
}

// Save appointments to localStorage
function saveAppointments(appointments: AppointmentStore[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
}

// Create a new appointment
export function createAppointment(appointment: Omit<AppointmentStore, 'id' | 'created_at' | 'updated_at'>): AppointmentStore {
  const appointments = getAllAppointments();
  
  const newAppointment: AppointmentStore = {
    ...appointment,
    id: `APT${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  appointments.push(newAppointment);
  saveAppointments(appointments);
  
  return newAppointment;
}

// Get appointments by customer ID
export function getAppointmentsByCustomer(customerId: number): AppointmentStore[] {
  const appointments = getAllAppointments();
  return appointments.filter(apt => apt.customer_id === customerId);
}

// Get appointments by staff ID
export function getAppointmentsByStaff(staffId: number): AppointmentStore[] {
  const appointments = getAllAppointments();
  return appointments.filter(apt => apt.staff_id === staffId);
}

// Get appointments by date
export function getAppointmentsByDate(date: string): AppointmentStore[] {
  const appointments = getAllAppointments();
  return appointments.filter(apt => apt.appointment_date === date);
}

// Get appointment by ID
export function getAppointmentById(id: string): AppointmentStore | null {
  const appointments = getAllAppointments();
  return appointments.find(apt => apt.id === id) || null;
}

// Update appointment
export function updateAppointment(id: string, updates: Partial<AppointmentStore>): AppointmentStore | null {
  const appointments = getAllAppointments();
  const index = appointments.findIndex(apt => apt.id === id);
  
  if (index === -1) return null;
  
  appointments[index] = {
    ...appointments[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  
  saveAppointments(appointments);
  return appointments[index];
}

// Update appointment status
export function updateAppointmentStatus(id: string, status: AppointmentStore['status']): AppointmentStore | null {
  return updateAppointment(id, { status });
}

// Cancel appointment
export function cancelAppointment(id: string): AppointmentStore | null {
  return updateAppointmentStatus(id, 'cancelled');
}

// Add a review to a completed appointment
export function addReview(id: string, rating: number, review?: string): AppointmentStore | null {
  return updateAppointment(id, { rating, review });
}

// Delete appointment
export function deleteAppointment(id: string): boolean {
  const appointments = getAllAppointments();
  const filtered = appointments.filter(apt => apt.id !== id);
  
  if (filtered.length === appointments.length) return false;
  
  saveAppointments(filtered);
  return true;
}

// Get upcoming appointments (not cancelled or completed)
export function getUpcomingAppointments(): AppointmentStore[] {
  const appointments = getAllAppointments();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return appointments.filter(apt => {
    if (apt.status === 'cancelled' || apt.status === 'completed') return false;
    
    const aptDate = new Date(apt.appointment_date);
    return aptDate >= today;
  });
}

// Get today's appointments
export function getTodayAppointments(): AppointmentStore[] {
  const today = format(new Date(), 'yyyy-MM-dd');
  return getAppointmentsByDate(today);
}

// Generate reminders for upcoming appointments (e.g., in the next few days)
export function getRemindersForCustomer(customerId: number) {
  const appointments = getAppointmentsByCustomer(customerId);
  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);

  const reminders = appointments
    .filter(apt => 
      (apt.status === 'confirmed' || apt.status === 'pending') && 
      new Date(apt.appointment_date) > now && 
      new Date(apt.appointment_date) <= nextWeek
    )
    .map(apt => ({
      id: `rem-${apt.id}`,
      title: 'Upcoming Appointment Reminder',
      message: `Your ${apt.service_name} appointment is coming up on ${format(new Date(apt.appointment_date), 'MMM d, yyyy')} at ${apt.appointment_time}.`,
      type: 'reminder',
      timestamp: 'Just now',
      read: false
    }));

  return reminders;
}

// Loyalty Points Management
const LOYALTY_STORAGE_KEY = 'salon_loyalty_points';

export function getCustomerLoyaltyData(customerId: number) {
  const stored = localStorage.getItem(LOYALTY_STORAGE_KEY);
  let redeemedPoints = 0;
  if (stored) {
    try {
      const data = JSON.parse(stored);
      redeemedPoints = data[customerId] || 0;
    } catch(e) {}
  }

  // Calculate earned points from completed appointments (10 per appointment)
  const completedAppointments = getAppointmentsByCustomer(customerId).filter(a => a.status === 'completed');
  const earnedPoints = completedAppointments.length * 10;
  
  return {
    earnedPoints,
    redeemedPoints,
    availablePoints: Math.max(0, earnedPoints - redeemedPoints)
  };
}

export function redeemLoyaltyPoints(customerId: number, pointsToRedeem: number): boolean {
  const { availablePoints } = getCustomerLoyaltyData(customerId);
  if (pointsToRedeem > availablePoints) return false;

  const stored = localStorage.getItem(LOYALTY_STORAGE_KEY);
  let data: Record<number, number> = {};
  if (stored) {
    try {
      data = JSON.parse(stored);
    } catch(e) {}
  }

  data[customerId] = (data[customerId] || 0) + pointsToRedeem;
  localStorage.setItem(LOYALTY_STORAGE_KEY, JSON.stringify(data));
  return true;
}

// Get staff rating based on reviews
export function getStaffRating(staffName: string): { average: number; count: number } {
  const appointments = getAllAppointments().filter(a => a.staff_name === staffName && typeof a.rating === 'number');
  if (appointments.length === 0) return { average: 5.0, count: 0 }; // Default to 5.0 if no ratings
  
  const sum = appointments.reduce((acc, curr) => acc + (curr.rating as number), 0);
  return { average: Number((sum / appointments.length).toFixed(1)), count: appointments.length };
}

// Get statistics for admin dashboard
export function getAppointmentStats() {
  const appointments = getAllAppointments();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const todayAppointments = appointments.filter(apt => apt.appointment_date === today);
  const confirmed = appointments.filter(apt => apt.status === 'confirmed');
  const pending = appointments.filter(apt => apt.status === 'pending');
  const completed = appointments.filter(apt => apt.status === 'completed');
  const cancelled = appointments.filter(apt => apt.status === 'cancelled');
  
  const todayRevenue = todayAppointments
    .filter(apt => apt.status === 'completed')
    .reduce((sum, apt) => sum + apt.service_price, 0);
  
  return {
    total: appointments.length,
    today: todayAppointments.length,
    todayRevenue,
    confirmed: confirmed.length,
    pending: pending.length,
    completed: completed.length,
    cancelled: cancelled.length,
  };
}

// Initialize with some sample data if empty (for demo purposes)
export function initializeSampleAppointments(): void {
  const existing = getAllAppointments();
  if (existing.length > 0) return; // Don't initialize if data already exists
  
  const sampleAppointments: Omit<AppointmentStore, 'id' | 'created_at' | 'updated_at'>[] = [
    {
      customer_id: 1,
      customer_name: 'Sarah Johnson',
      customer_email: 'sarah.j@email.com',
      customer_phone: '+1 (555) 123-4567',
      staff_id: 1,
      staff_name: 'Emma Wilson',
      service_id: 1,
      service_name: 'Hair Cut & Style',
      service_duration: 60,
      service_price: 85,
      appointment_date: format(new Date(), 'yyyy-MM-dd'),
      appointment_time: '10:00',
      status: 'confirmed',
      notes: 'Regular customer, prefers layered cut',
      booked_by: 'customer',
    },
    {
      customer_id: 2,
      customer_name: 'Mike Chen',
      customer_email: 'mike.c@email.com',
      customer_phone: '+1 (555) 234-5678',
      staff_id: 2,
      staff_name: 'Lisa Davis',
      service_id: 3,
      service_name: 'Signature Facial',
      service_duration: 75,
      service_price: 120,
      appointment_date: format(new Date(), 'yyyy-MM-dd'),
      appointment_time: '14:00',
      status: 'pending',
      notes: 'First-time facial treatment',
      booked_by: 'customer',
    },
    {
      customer_id: 3,
      customer_name: 'Anna Rodriguez',
      customer_email: 'anna.r@email.com',
      customer_phone: '+1 (555) 345-6789',
      staff_id: 3,
      staff_name: 'Sarah Johnson',
      service_id: 4,
      service_name: 'Gel Manicure',
      service_duration: 45,
      service_price: 65,
      appointment_date: format(new Date(), 'yyyy-MM-dd'),
      appointment_time: '15:30',
      status: 'confirmed',
      notes: 'Regular manicure with gel polish',
      booked_by: 'admin',
    },
  ];
  
  sampleAppointments.forEach(apt => createAppointment(apt));
}
