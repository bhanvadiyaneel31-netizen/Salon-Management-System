import { useState, useEffect } from 'react';
import { User, Scissors, Phone, Mail, Clock, Star, Calendar as CalendarIcon } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Sheet, SheetContent } from '../ui/sheet';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { api, staffAPI, appointmentsAPI } from '../../services/api';
import { useNotifications } from '../shared/hooks/useNotifications';

import { OverviewPanel } from './panels/OverviewPanel';
import { AppointmentsPanel } from './panels/AppointmentsPanel';
import { SchedulePanel } from './panels/SchedulePanel';
import { StaffNotificationsPanel } from './panels/NotificationsPanel';
import { ReviewsPanel } from './panels/ReviewsPanel';
import { SettingsPanel } from './panels/SettingsPanel';

interface Appointment {
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address?: string;
    loyalty_points?: number;
  };
  service: {
    name: string;
    duration: number;
    price: number;
  };
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  preferences?: string;
  isFirstTime?: boolean;
  price: number;
  original_amount?: number;
  discount_amount?: number;
  final_amount?: number;
  points_redeemed?: number;
}

interface StaffDashboardProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  setCurrentView: (view: string) => void;
  setUserRole: (role: string | null) => void;
  isDark: boolean;
  toggleDark: () => void;
}

export function StaffDashboard({
  activeSection,
  setActiveSection,
  setCurrentView,
  setUserRole,
  isDark,
  toggleDark
}: StaffDashboardProps) {
  const [userData, setUserData] = useState<any>(api.auth.getCurrentUser());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [staffRating, setStaffRating] = useState({ average: 0, count: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);

  const { notifications } = useNotifications(activeSection);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const appts = await appointmentsAPI.getAll();
      setAppointments(appts.map((a: any) => ({
        id: String(a.id),
        customer: {
          name: a.customer?.name || 'Unknown',
          email: a.customer?.email || '',
          phone: a.customer?.phone || '',
          address: a.customer?.address || '',
          loyalty_points: a.customer?.loyalty_points || 0
        },
        service: {
          name: a.service?.name || 'Service',
          duration: a.service?.duration || 0,
          price: a.price || 0
        },
        date: a.appointment_date,
        time: a.appointment_time,
        status: a.status as any,
        notes: a.notes,
        isFirstTime: false,
        price: a.price || 0,
        original_amount: a.original_amount || a.price || 0,
        discount_amount: a.discount_amount || 0,
        final_amount: a.final_amount || a.price || 0,
        points_redeemed: a.points_redeemed || 0
      })));

      const ratingData = await staffAPI.getRating(userData.id);
      setStaffRating(ratingData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const data = await api.reviews.getStaffReviews();
      setReviews(data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  };

  useEffect(() => {
    if (userData?.id) {
      const fetchData = () => {
        loadDashboardData();
        loadReviews();
      };
      fetchData();
      const interval = setInterval(fetchData, 60000); // Poll every minute
      return () => clearInterval(interval);
    }
  }, [userData?.id]);

  const handleProfileSave = (updatedUser: any) => {
    setUserData(updatedUser);
    loadDashboardData();
  };

  const updateAppointmentStatus = async (id: string, status: Appointment['status']) => {
    try {
      await appointmentsAPI.updateStatus(id, status);
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      if (selectedAppointment?.id === id) {
        setSelectedAppointment(prev => prev ? { ...prev, status } : null);
      }
      toast.success(`Appointment marked as ${status}`);
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update status');
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <OverviewPanel appointments={appointments} staffRating={staffRating} notifications={notifications} />;
      case 'appointments':
        return <AppointmentsPanel appointments={appointments} onSelect={(apt) => { setSelectedAppointment(apt); setIsDetailsPanelOpen(true); }} />;
      case 'schedule':
        return <SchedulePanel appointments={appointments} onUpdateStatus={updateAppointmentStatus} />;
      case 'notifications':
        return (
          <StaffNotificationsPanel
            activeSection={activeSection}
            appointments={appointments}
            onAppointmentSelect={(apt) => { setSelectedAppointment(apt); setIsDetailsPanelOpen(true); }}
            setAppointments={setAppointments}
            setActiveSection={setActiveSection}
          />
        );
      case 'reviews':
        return <ReviewsPanel reviews={reviews} staffRating={staffRating} />;
      case 'settings':
        return <SettingsPanel userData={userData} staffRating={staffRating} onSave={handleProfileSave} />;
      default:
        return <OverviewPanel appointments={appointments} staffRating={staffRating} notifications={notifications} />;
    }
  };

  return (
    <div className="py-4 lg:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {activeSection === 'dashboard' ? 'Dashboard Overview' :
                  activeSection === 'appointments' ? 'My Appointments' :
                    activeSection === 'schedule' ? 'Work Schedule' :
                      activeSection === 'notifications' ? 'Notifications' :
                        activeSection === 'settings' ? 'Account Settings' :
                          activeSection.replace('-', ' ')}
              </h1>
              <p className="text-gray-500 text-sm">Staff Portal • Welcome back, {userData?.name || 'Staff Member'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-100 px-3 py-1">
              {userData?.role === 'staff' ? 'Professional' : 'Staff'}
            </Badge>
          </div>
        </div>

        <div className="space-y-6 lg:space-y-8">
          {renderContent()}
        </div>
      </div>

      {/* Appointment Details Sheet */}
      <Sheet open={isDetailsPanelOpen} onOpenChange={setIsDetailsPanelOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 border-0 overflow-y-auto">
          {selectedAppointment && (
            <div className="h-full flex flex-col bg-white">
              <div className="p-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <div className="flex justify-between items-start mb-4">
                  <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-md uppercase text-[10px] px-2">
                    Appointment Info
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold mb-1">{selectedAppointment.customer.name}</h3>
                <p className="text-purple-100 flex items-center gap-2 text-sm">
                  <Scissors className="w-4 h-4" />
                  {selectedAppointment.service.name}
                </p>
              </div>

              <div className="p-6 space-y-8 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400 uppercase tracking-widest">Date</Label>
                    <p className="font-bold flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-purple-500" />
                      {format(new Date(selectedAppointment.date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400 uppercase tracking-widest">Time</Label>
                    <p className="font-bold flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-500" />
                      {selectedAppointment.time}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs text-gray-400 uppercase tracking-widest">Status</Label>
                  <div className="flex flex-wrap gap-2">
                    {['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'].map((s) => (
                      <Button
                        key={s}
                        variant={selectedAppointment.status === s ? 'default' : 'outline'}
                        size="sm"
                        className={`rounded-full text-[10px] h-8 px-4 ${selectedAppointment.status === s ? 'shadow-md' : 'border-purple-100'}`}
                        onClick={() => updateAppointmentStatus(selectedAppointment.id, s as any)}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Phone</p>
                      <p className="font-medium text-gray-900">{selectedAppointment.customer.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Email</p>
                      <p className="font-medium text-gray-900">{selectedAppointment.customer.email}</p>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100 space-y-3">
                    <Label className="text-[10px] text-gray-400 uppercase tracking-widest block mb-2">Financial Summary</Label>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Original Price:</span>
                      <span className="font-medium">${(selectedAppointment as any).original_amount || selectedAppointment.price}</span>
                    </div>
                    {((selectedAppointment as any).discount_amount > 0 || (selectedAppointment as any).points_redeemed > 0) && (
                      <div className="flex justify-between text-sm text-red-500">
                        <span>Discount {(selectedAppointment as any).points_redeemed > 0 ? `(${(selectedAppointment as any).points_redeemed} pts)` : ''}:</span>
                        <span>-${(selectedAppointment as any).discount_amount || 0}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold pt-2 border-t border-purple-100">
                      <span className="text-gray-900">Net Revenue:</span>
                      <span className="text-purple-600">${(selectedAppointment as any).final_amount || ((selectedAppointment as any).price - ((selectedAppointment as any).discount_amount || 0))}</span>
                    </div>
                  </div>

                  {/* Loyalty Status */}
                  <div className="p-4 bg-white rounded-2xl border border-purple-100 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <Star className="w-4 h-4 text-purple-500 fill-purple-500" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">Customer Loyalty Balance</p>
                        <p className="font-bold text-gray-900">{(selectedAppointment.customer as any).loyalty_points || 0} pts</p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedAppointment.notes && (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <Label className="text-xs text-gray-400 uppercase tracking-widest mb-2 block">Customer Notes</Label>
                    <p className="text-sm text-gray-700 leading-relaxed italic">"{selectedAppointment.notes}"</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={() => setIsDetailsPanelOpen(false)}>
                  Close
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 rounded-xl h-11">
                  Contact
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
