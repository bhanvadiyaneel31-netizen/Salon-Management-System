import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Calendar as CalendarPicker } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Plus, Calendar as CalendarIcon, Star } from "lucide-react";
import { toast } from "sonner";
import { format, addDays } from 'date-fns';
import { api, appointmentsAPI } from "../../services/api";

import { OverviewPanel } from './panels/OverviewPanel';
import { ServicesPanel } from './panels/ServicesPanel';
import { AppointmentsPanel } from './panels/AppointmentsPanel';
import { NotificationsPanel } from './panels/NotificationsPanel';
import { ProfilePanel } from './panels/ProfilePanel';
import { LoyaltyPanel } from './panels/LoyaltyPanel';

interface CustomerDashboardProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  setCurrentView: (view: string) => void;
  setUserRole: (role: string | null) => void;
  setPreselectedServiceId: (id: string | null) => void;
  isDark?: boolean;
  toggleDark?: () => void;
}

export function CustomerDashboard({
  activeSection,
  setActiveSection,
  setCurrentView,
  setUserRole,
  setPreselectedServiceId,
  isDark,
  toggleDark
}: CustomerDashboardProps) {
  // Profile state
  const [profile, setProfile] = useState({
    name: api.auth.getCurrentUser()?.name || 'Customer',
    email: api.auth.getCurrentUser()?.email || '',
    phone: api.auth.getCurrentUser()?.phone || '',
    address: api.auth.getCurrentUser()?.address || '',
    profile_image: api.auth.getCurrentUser()?.profile_image || '',
    totalAppointments: 0,
    loyaltyPoints: 0,
    joinDate: api.auth.getCurrentUser()?.created_at || ''
  });

  const handleProfileSave = (updatedUser: any) => {
    setProfile(prev => ({
      ...prev,
      name: updatedUser.name || prev.name,
      email: updatedUser.email || prev.email,
      phone: updatedUser.phone || prev.phone,
      address: updatedUser.address || prev.address,
      profile_image: updatedUser.profile_image ?? prev.profile_image,
    }));
  };

  // Appointments state
  const [appointments, setAppointments] = useState<any[]>([]);

  // Reschedule state
  const [rescheduleDate, setRescheduleDate] = useState<Date>(new Date());
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<any>(null);
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Review state
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [appointmentToReview, setAppointmentToReview] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const loadProfile = async () => {
    try {
      const userData = await api.auth.getProfile();
      setProfile(prev => ({
        ...prev,
        name: userData.name || prev.name,
        email: userData.email || prev.email,
        phone: userData.phone || prev.phone,
        address: userData.address || prev.address,
        profile_image: userData.profile_image || prev.profile_image,
        loyaltyPoints: userData.loyalty_points ?? 0,
        totalAppointments: userData.total_appointments ?? 0,
        joinDate: userData.created_at || prev.joinDate
      }));
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const loadAppointments = async () => {
    try {
      const data = await appointmentsAPI.getAll();
      const transformed = data.map((apt: any) => ({
        id: String(apt.id),
        service: {
          id: apt.service_id || apt.service?.id,
          name: apt.service?.name || apt.service_name || '',
          price: apt.price || apt.service?.price || 0,
          duration: apt.service?.duration || apt.service_duration || 0
        },
        date: apt.appointment_date,
        time: apt.appointment_time,
        staff: {
          id: apt.staff_id || apt.staff?.id,
          name: apt.staff?.name || apt.staff_name || 'Unassigned',
          speciality: ''
        },
        status: apt.status,

        bookingId: String(apt.id),
        createdAt: apt.created_at,
        notes: apt.notes || '',
        rating: apt.rating,
        review: apt.review
      }));
      setAppointments(transformed);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([loadAppointments(), loadProfile()]);
    };
    loadAllData();
    const interval = setInterval(() => {
      loadAppointments();
      loadProfile(); // keep loyalty points & visit count in sync
    }, 10000); // 10s polling for real-time feel
    return () => clearInterval(interval);
  }, [activeSection]);

  const handleReschedule = (appointment: any) => {
    setAppointmentToReschedule(appointment);
    setRescheduleDate(new Date(appointment.date));
    setRescheduleTime(appointment.time);
    setIsRescheduleDialogOpen(true);
  };

  useEffect(() => {
    if (isRescheduleDialogOpen && appointmentToReschedule && rescheduleDate) {
      const fetchSlots = async () => {
        setLoadingSlots(true);
        try {
          const dateStr = format(rescheduleDate, 'yyyy-MM-dd');
          const slots = await appointmentsAPI.getAvailableSlots(
            dateStr,
            appointmentToReschedule.staff.id,
            appointmentToReschedule.service.id,
            appointmentToReschedule.id
          );

          setRescheduleSlots(slots);
        } catch (error) {
          console.error('Failed to fetch reschedule slots:', error);
          toast.error("Failed to load available slots");
        } finally {
          setLoadingSlots(false);
        }
      };
      fetchSlots();
    }
  }, [isRescheduleDialogOpen, rescheduleDate, appointmentToReschedule]);

  const submitReschedule = async () => {
    if (!rescheduleTime) {
      toast.error("Please select a time slot");
      return;
    }
    try {
      const formattedDate = format(rescheduleDate, 'yyyy-MM-dd');
      await appointmentsAPI.reschedule(appointmentToReschedule.id, formattedDate, rescheduleTime);
      setAppointments(prev => prev.map(apt =>
        apt.id === appointmentToReschedule.id
          ? { ...apt, date: formattedDate, time: rescheduleTime }
          : apt
      ));
      setIsRescheduleDialogOpen(false);
      toast.success("Appointment rescheduled successfully");
    } catch (err) {
      console.error('Failed to reschedule:', err);
      toast.error("Failed to reschedule appointment");
    }
  };

  const handleReview = (appointment: any) => {
    setAppointmentToReview(appointment);
    setReviewRating(appointment.rating || 5);
    setReviewText(appointment.review || '');
    setIsReviewDialogOpen(true);
  };

  const submitReview = async () => {
    try {
      await appointmentsAPI.submitReview(appointmentToReview.id, reviewRating, reviewText);
      setAppointments(prev => prev.map(apt =>
        apt.id === appointmentToReview.id
          ? { ...apt, rating: reviewRating, review: reviewText }
          : apt
      ));
      setIsReviewDialogOpen(false);
      toast.success("Thank you for your review!");
    } catch (err) {
      console.error('Failed to submit review:', err);
      toast.error("Failed to submit review");
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <OverviewPanel
            profile={profile}
            appointments={appointments}
            upcomingAppointments={appointments.filter(a => a.status !== 'cancelled' && a.status !== 'completed')}
            setActiveSection={setActiveSection}
            setCurrentView={setCurrentView}
            setPreselectedServiceId={setPreselectedServiceId}
          />
        );
      case 'services':
        return (
          <ServicesPanel
            setCurrentView={setCurrentView}
            setPreselectedServiceId={setPreselectedServiceId}
          />
        );
      case 'appointments':
        return (
          <AppointmentsPanel
            setCurrentView={setCurrentView}
            onReschedule={handleReschedule}
            onReview={handleReview}
          />
        );
      case 'loyalty':
        return <LoyaltyPanel profile={profile} />;
      case 'notifications':
        return <NotificationsPanel activeSection={activeSection} />;
      case 'profile':
        return <ProfilePanel profile={profile} onSave={handleProfileSave} />;
      default:
        return (
          <OverviewPanel
            profile={profile}
            appointments={appointments}
            upcomingAppointments={appointments.filter(a => a.status !== 'cancelled' && a.status !== 'completed')}
            setActiveSection={setActiveSection}
            setCurrentView={setCurrentView}
            setPreselectedServiceId={setPreselectedServiceId}
          />
        );
    }
  };

  return (
    <div className="py-4 lg:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {activeSection === 'dashboard' ? 'My Dashboard' :
                activeSection === 'services' ? 'Available Services' :
                  activeSection === 'appointments' ? 'My Bookings' :
                    activeSection === 'notifications' ? 'Notifications' :
                      activeSection === 'profile' ? 'My Profile' :
                        activeSection.replace('-', ' ')}
            </h1>
            <p className="text-gray-500 text-sm">Welcome back, {profile.name.split(' ')[0]} ✨</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCurrentView('booking')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl shadow-lg border-0 px-6 h-11"
            >
              <Plus className="w-4 h-4 mr-2" />
              Book New Appointment
            </Button>
          </div>
        </div>

        <div className="space-y-6 lg:space-y-8">
          {renderContent()}
        </div>
      </div>

      {/* Reschedule Dialog */}
      <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>Select a new date and time for your appointment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal rounded-xl border-purple-100">
                    <CalendarIcon className="mr-2 h-4 w-4 text-purple-500" />
                    {format(rescheduleDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl border-purple-50 shadow-xl">
                  <CalendarPicker
                    mode="single"
                    selected={rescheduleDate}
                    onSelect={(date) => date && setRescheduleDate(date)}
                    disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Select Time Slot</Label>
              {loadingSlots ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                </div>
              ) : rescheduleSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {rescheduleSlots.map((t) => (
                    <Button
                      key={t}
                      variant={rescheduleTime === t ? 'default' : 'outline'}
                      className={`rounded-lg text-xs h-9 ${rescheduleTime === t ? 'bg-purple-600' : 'border-purple-50'}`}
                      onClick={() => setRescheduleTime(t)}
                    >{t}</Button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-xs text-red-500 py-2">No available slots for this date.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setIsRescheduleDialogOpen(false)}>Cancel</Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl" onClick={submitReschedule} disabled={loadingSlots || !rescheduleTime}>Confirm New Time</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Share Your Experience</DialogTitle>
            <DialogDescription>How was your session at Bella Salon?</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setReviewRating(s)}>
                  <Star className={`w-10 h-10 ${s <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label>Write a review (optional)</Label>
              <Textarea
                placeholder="Tell us what you liked about the service..."
                className="rounded-2xl border-purple-100 focus:border-purple-300 min-h-[100px]"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setIsReviewDialogOpen(false)}>Maybe Later</Button>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl" onClick={submitReview}>Submit Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
