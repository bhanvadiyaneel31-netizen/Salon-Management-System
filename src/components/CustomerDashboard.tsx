import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Calendar as CalendarPicker } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Progress } from "./ui/progress";
import { Slider } from "./ui/slider";
import { Textarea } from "./ui/textarea";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "./ui/sheet";
import { Switch } from "./ui/switch";
import { 
  Calendar, 
  Clock, 
  User, 
  Plus, 
  Settings, 
  LogOut, 
  MoreHorizontal,
  Search,
  Filter,
  Bell,
  CalendarIcon,
  Star,
  Phone,
  Mail,
  MapPin,
  Scissors,
  Sparkles,
  Heart,
  Eye,
  Edit,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowRight,
  Zap,
  TrendingUp,
  DollarSign,
  Menu
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { toast } from "sonner";
import { format, addDays, startOfDay, isAfter, isBefore } from 'date-fns';
import { api, appointmentsAPI, servicesAPI, staffAPI } from "../services/api";
import { safeFormatDate } from "./ui/utils";


interface CustomerDashboardProps {
  setCurrentView: (view: string) => void;
  setUserRole: (role: string | null) => void;
}

export function CustomerDashboard({ setCurrentView, setUserRole }: CustomerDashboardProps) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 300]);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    reminders: {
      email: true,
      sms: true,
      timing: '24h'
    }
  });

  // Reschedule state
  const [rescheduleDate, setRescheduleDate] = useState<Date>(new Date());
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<any>(null);

  // Review state
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [appointmentToReview, setAppointmentToReview] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  // Available Services & Staff Data
  const [services, setServices] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('0');

  // Customer Appointments Data - Load from real backend
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const loadAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const data = await appointmentsAPI.getAll();
      // Transform backend response to match component's expected shape
      const transformed = data.map((apt: any) => ({
        id: String(apt.id),
        service: {
          name: apt.service?.name || apt.service_name || '',
          price: apt.price || apt.service?.price || 0,
          duration: apt.service?.duration || apt.service_duration || 0
        },
        date: apt.appointment_date,
        time: apt.appointment_time,
        staff: {
          name: apt.staff?.name || 'Unassigned',
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
    } finally {
      setLoadingAppointments(false);
    }
  };

  // Load data on mount and when section changes
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [servicesData, staffData] = await Promise.all([
          servicesAPI.getAll(),
          staffAPI.getAll()
        ]);
        setServices(servicesData.map((s: any) => ({
          ...s,
          image: `https://picsum.photos/seed/${(s.name || 'salon').replace(/\s+/g, '')}/400/300`,
          staff: staffData.filter((st: any) => st.status === 'active' || st.is_available).map((st: any) => st.name)
        })));
        setStaffMembers(staffData.filter((s:any) => s.status === 'active' || s.is_available));
      } catch (err) {
        console.error('Failed to load services or staff:', err);
      }
      await loadAppointments();
    };
    loadAllData();
  }, [activeSection]);

  // Notifications Data
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Appointment Confirmed',
      message: 'Your Hair Cut & Style appointment has been confirmed for January 15th at 2:00 PM',
      type: 'confirmation',
      timestamp: '2 hours ago',
      read: false
    },
    {
      id: 2,
      title: 'Reminder',
      message: 'You have an appointment tomorrow at 11:00 AM for Facial Treatment',
      type: 'reminder',
      timestamp: '1 day ago',
      read: false
    },
    {
      id: 3,
      title: 'New Service Available',
      message: 'Try our new Anti-Aging Facial treatment with 20% off for first-time customers',
      type: 'promotion',
      timestamp: '3 days ago',
      read: false
    },
    {
      id: 4,
      title: 'Appointment Completed',
      message: 'Thank you for visiting! Please rate your experience with Sarah Johnson',
      type: 'completion',
      timestamp: '1 week ago',
      read: true
    }
  ]);

  // Customer Profile Data - Load from authenticated user
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    joinDate: '',
    totalAppointments: 0,
    loyaltyPoints: 0,
    reminders: {
      email: true,
      sms: true,
      timing: '24h'
    }
  });

  // Load user profile on mount and when appointments change
  useEffect(() => {
    const currentUser = api.auth.getCurrentUser();
    if (currentUser) {
      setProfile(prev => ({
        ...prev,
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone || '',
        address: '',
        joinDate: currentUser.created_at || new Date().toISOString(),
        totalAppointments: appointments.length,
        loyaltyPoints: (currentUser as any).loyalty_points || 0
      }));
    }
  }, [appointments.length]);
  
  // Initialize profile form on mount
  useEffect(() => {
    const currentUser = api.auth.getCurrentUser();
    if (currentUser) {
      setProfileForm(prev => ({
        ...prev,
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone || '',
        address: ''
      }));
    }
  }, []); // Run only once on mount

  const handleLogout = () => {
    // Clear user data from localStorage
    api.auth.logout();
    setUserRole(null);
    setCurrentView('home');
    toast.success('Logged out successfully');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle2 className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'pending': return 25;
      case 'confirmed': return 75;
      case 'completed': return 100;
      case 'cancelled': return 0;
      default: return 0;
    }
  };

  // Filter services based on search and filters
  const filteredServices = services.filter(service => {
    const matchesSearch = (service.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (service.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
    const matchesPrice = service.price >= priceRange[0] && service.price <= priceRange[1];
    
    return matchesSearch && matchesCategory && matchesPrice;
  });

  // Separate appointments by status
  const upcomingAppointments = appointments.filter(apt => 
    apt.status === 'pending' || apt.status === 'confirmed'
  );
  
  const pastAppointments = appointments.filter(apt => 
    apt.status === 'completed' || apt.status === 'cancelled'
  );

  const handleBookService = (service: any) => {
    setSelectedService(service);
    setIsBookingDialogOpen(true);
  };

  const confirmBooking = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select date and time');
      return;
    }

    const currentUser = api.auth.getCurrentUser();
    if (!currentUser) {
      toast.error('Please log in to book an appointment');
      return;
    }

    try {
      await appointmentsAPI.create({
        service_id: selectedService.id,
        staff_id: parseInt(selectedStaffId),
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        appointment_time: selectedTime,
        notes: ''
      });
      setIsBookingDialogOpen(false);
      setSelectedService(null);
      setSelectedTime('');
      await loadAppointments(); // Reload from backend
      toast.success('Appointment booked successfully! You will receive a confirmation soon.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create appointment. Please try again.');
    }
  };

  const markNotificationAsRead = (notificationId: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
    setUnreadNotifications(prev => Math.max(0, prev - 1));
  };

  const updateProfile = () => {
    // Validate required fields
    if (!profileForm.name || !profileForm.email || !profileForm.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const currentUser = api.auth.getCurrentUser();
      if (!currentUser) {
        toast.error('User not found');
        return;
      }

      // Update the user object in localStorage
      const updatedUser = {
        ...currentUser,
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Update the profile with form data (including reminder preferences)
      const updatedProfile = {
        ...profile,
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        address: profileForm.address,
        reminders: profileForm.reminders
      };

      setProfile(updatedProfile);
      setIsProfileDialogOpen(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile. Please try again.');
    }
  };

  // Initialize profile form when dialog opens — restores all fields including reminders
  const openProfileDialog = () => {
    setProfileForm(prev => ({
      ...prev,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
      reminders: {
        email: profile.reminders?.email ?? true,
        sms: profile.reminders?.sms ?? true,
        timing: profile.reminders?.timing ?? '24h'
      }
    }));
    setIsProfileDialogOpen(true);
  };

  // Handle reschedule functionality
  const handleReschedule = (appointment: any) => {
    setAppointmentToReschedule(appointment);
    setRescheduleDate(new Date(appointment.date));
    setRescheduleTime(appointment.time);
    setIsRescheduleDialogOpen(true);
  };

  const confirmReschedule = () => {
    if (!rescheduleDate || !rescheduleTime) {
      toast.error('Please select both date and time');
      return;
    }

    setAppointments(prev => 
      prev.map(apt => 
        apt.id === appointmentToReschedule.id 
          ? { 
              ...apt, 
              date: format(rescheduleDate, 'yyyy-MM-dd'), 
              time: rescheduleTime,
              status: 'pending' // Reset to pending after reschedule
            }
          : apt
      )
    );

    setIsRescheduleDialogOpen(false);
    setAppointmentToReschedule(null);
    toast.success('Appointment rescheduled successfully!');
  };

  // Handle cancel functionality
  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await appointmentsAPI.updateStatus(parseInt(appointmentId), 'cancelled');
      await loadAppointments();
      toast.success('Appointment cancelled successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel appointment');
    }
  };

  const handleRedeemPoints = (points: number) => {
    if (profile.loyaltyPoints >= points) {
      setProfile(prev => ({ ...prev, loyaltyPoints: prev.loyaltyPoints - points }));
      toast.success(`Successfully redeemed ${points} points for a discount!`);
    } else {
      toast.error('Failed to redeem points. Not enough available.');
    }
  };

  const submitReview = async () => {
    if (!appointmentToReview) return;
    try {
      await appointmentsAPI.submitReview(appointmentToReview.id, reviewRating, reviewText);
      // Only update state after a successful API response
      setAppointments(prev => prev.map(a =>
        a.id === appointmentToReview.id ? { ...a, rating: reviewRating, review: reviewText } : a
      ));
      setIsReviewDialogOpen(false);
      setAppointmentToReview(null);
      setReviewRating(5);
      setReviewText('');
      toast.success('Thank you for your review!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit review. Please try again.');
    }
  };

  // Sidebar content component (reused for both desktop and mobile)
  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <CardHeader className="text-center pb-4">
        <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto flex items-center justify-center mb-4">
          <User className="w-10 h-10 text-white" />
        </div>
        <CardTitle className="text-xl font-bold text-gray-900">{profile.name}</CardTitle>
        <p className="text-sm text-gray-600">Customer Dashboard</p>
        <Badge className="bg-purple-100 text-purple-700 mt-2">
          {profile.loyaltyPoints} points
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          variant="ghost"
          className={`w-full justify-start rounded-xl ${
            activeSection === 'dashboard' 
              ? 'text-purple-600 bg-purple-50' 
              : 'text-gray-600 hover:bg-purple-50'
          }`}
          onClick={() => {
            setActiveSection('dashboard');
            onNavigate?.();
          }}
        >
          <TrendingUp className="w-4 h-4 mr-3" />
          Dashboard
        </Button>
        <Button
          variant="ghost"
          className={`w-full justify-start rounded-xl ${
            activeSection === 'services' 
              ? 'text-purple-600 bg-purple-50' 
              : 'text-gray-600 hover:bg-purple-50'
          }`}
          onClick={() => {
            setActiveSection('services');
            onNavigate?.();
          }}
        >
          <Scissors className="w-4 h-4 mr-3" />
          Browse Services
        </Button>
        <Button
          variant="ghost"
          className={`w-full justify-start rounded-xl ${
            activeSection === 'appointments' 
              ? 'text-purple-600 bg-purple-50' 
              : 'text-gray-600 hover:bg-purple-50'
          }`}
          onClick={() => {
            setActiveSection('appointments');
            onNavigate?.();
          }}
        >
          <Calendar className="w-4 h-4 mr-3" />
          My Appointments
        </Button>
        <Button
          variant="ghost"
          className={`w-full justify-start rounded-xl relative ${
            activeSection === 'notifications' 
              ? 'text-purple-600 bg-purple-50' 
              : 'text-gray-600 hover:bg-purple-50'
          }`}
          onClick={() => {
            setActiveSection('notifications');
            onNavigate?.();
          }}
        >
          <Bell className="w-4 h-4 mr-3" />
          Notifications
          {unreadNotifications > 0 && (
            <Badge className="ml-auto bg-red-500 text-white text-xs px-2 py-1">
              {unreadNotifications}
            </Badge>
          )}
        </Button>
        <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:bg-purple-50 rounded-xl"
              onClick={openProfileDialog}
            >
              <Settings className="w-4 h-4 mr-3" />
              Profile Settings
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Profile Settings</DialogTitle>
              <DialogDescription>
                Update your personal information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto flex items-center justify-center mb-4">
                  <User className="w-10 h-10 text-white" />
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label>Full Name *</Label>
                  <Input 
                    value={profileForm.name} 
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    className="border-purple-200 focus:border-purple-400 rounded-xl" 
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input 
                    type="email"
                    value={profileForm.email} 
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    className="border-purple-200 focus:border-purple-400 rounded-xl" 
                  />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input 
                    value={profileForm.phone} 
                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="border-purple-200 focus:border-purple-400 rounded-xl" 
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Textarea 
                    value={profileForm.address} 
                    onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                    className="border-purple-200 focus:border-purple-400 rounded-xl" 
                  />
                </div>
                
                {/* Appointment Reminders UI */}
                <div className="pt-4 border-t border-purple-100">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-purple-500" />
                    Appointment Reminders
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-reminders" className="flex flex-col">
                        <span>Email Reminders</span>
                        <span className="font-normal text-xs text-gray-500">Receive an email before your appointment</span>
                      </Label>
                      <Switch 
                        id="email-reminders" 
                        checked={profileForm.reminders?.email}
                        onCheckedChange={(checked) => setProfileForm(prev => ({ 
                          ...prev, 
                          reminders: { ...prev.reminders, email: checked } 
                        }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sms-reminders" className="flex flex-col">
                        <span>SMS Reminders</span>
                        <span className="font-normal text-xs text-gray-500">Receive a text before your appointment</span>
                      </Label>
                      <Switch 
                        id="sms-reminders" 
                        checked={profileForm.reminders?.sms}
                        onCheckedChange={(checked) => setProfileForm(prev => ({ 
                          ...prev, 
                          reminders: { ...prev.reminders, sms: checked } 
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reminder Timing</Label>
                      <Select 
                        value={profileForm.reminders?.timing} 
                        onValueChange={(value) => setProfileForm(prev => ({ 
                          ...prev, 
                          reminders: { ...prev.reminders, timing: value } 
                        }))}
                      >
                        <SelectTrigger className="border-purple-200 rounded-xl">
                          <SelectValue placeholder="Select timing" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1h">1 hour before</SelectItem>
                          <SelectItem value="24h">24 hours before</SelectItem>
                          <SelectItem value="48h">48 hours before</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600 space-y-1 mt-4">
                <p>Member since: {safeFormatDate(profile.joinDate, 'MMMM yyyy')}</p>
                <p>Total appointments: {profile.totalAppointments}</p>
                <p>Loyalty points: {profile.loyaltyPoints}</p>
              </div>
            </div>
            <DialogFooter className="gap-2 flex-col sm:flex-row">
              <Button variant="outline" onClick={() => setIsProfileDialogOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button 
                onClick={updateProfile}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 w-full sm:w-auto"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:bg-red-50 rounded-xl"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-3" />
          Logout
        </Button>
      </CardContent>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Mobile Header with Menu Button */}
        <div className="lg:hidden mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="border-purple-200">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
              <Card className="border-0 rounded-none h-full">
                <SidebarContent onNavigate={() => setIsMobileSidebarOpen(false)} />
              </Card>
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl sticky top-24">
              <SidebarContent />
            </Card>
          </div>

          {/* Main Content */}
          <div className="col-span-full lg:col-span-4 space-y-6 lg:space-y-8">
            {activeSection === 'dashboard' && (
              <>
                {/* Welcome Header */}
                <Card className="border-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl shadow-xl text-white">
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-bold mb-2">Welcome back, {profile.name.split(' ')[0]}! ✨</h2>
                    <p className="text-purple-100 mb-6">
                      Ready for your next beauty session? Discover our services or check your upcoming appointments.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        onClick={() => setActiveSection('services')}
                        className="bg-white text-purple-600 hover:bg-gray-50 rounded-xl"
                      >
                        <Scissors className="w-4 h-4 mr-2" />
                        Browse Services
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setActiveSection('appointments')}
                        className="border-purple-200 bg-white text-purple-600 hover:bg-purple-50 hover:text-purple-700 rounded-xl"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        My Appointments
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600">Total Appointments</p>
                          <p className="text-3xl font-bold text-gray-900">{profile.totalAppointments}</p>
                        </div>
                        <Calendar className="w-10 h-10 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600">Loyalty Points</p>
                          <div className="flex items-center gap-2">
                            <p className="text-3xl font-bold text-gray-900">{profile.loyaltyPoints}</p>
                          </div>
                          {profile.loyaltyPoints >= 50 && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="mt-2 text-xs border-amber-200 text-amber-700 hover:bg-amber-50" 
                              onClick={() => handleRedeemPoints(50)}
                            >
                              Redeem 50 pts
                            </Button>
                          )}
                        </div>
                        <Star className="w-10 h-10 text-yellow-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-600">Next Appointment</p>
                          <p className="text-lg font-bold text-gray-900">
                            {upcomingAppointments.length > 0 
                              ? format(new Date(upcomingAppointments[0].date), 'MMM d')
                              : 'None scheduled'
                            }
                          </p>
                        </div>
                        <Clock className="w-10 h-10 text-pink-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Upcoming Appointments Summary */}
                <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl font-bold text-gray-900">Upcoming Appointments</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveSection('appointments')}
                      className="border-purple-200 text-purple-600 hover:bg-purple-50 rounded-xl"
                    >
                      View All
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {upcomingAppointments.length > 0 ? (
                      <div className="space-y-4">
                        {upcomingAppointments.slice(0, 2).map((appointment) => (
                          <div
                            key={appointment.id}
                            className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-gray-900">{appointment.service.name}</h3>
                                <div className="flex items-center text-gray-600 space-x-4 mt-1">
                                  <span className="flex items-center text-sm">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {format(new Date(appointment.date), 'MMM d, yyyy')}
                                  </span>
                                  <span className="flex items-center text-sm">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {appointment.time}
                                  </span>
                                </div>
                              </div>
                              <Badge className={`${getStatusColor(appointment.status)} border`}>
                                {getStatusIcon(appointment.status)}
                                <span className="ml-1">{appointment.status}</span>
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No upcoming appointments</p>
                        <Button
                          size="sm"
                          onClick={() => setActiveSection('services')}
                          className="mt-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl"
                        >
                          Book Now
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {activeSection === 'services' && (
              <>
                {/* Services Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Available Services</h1>
                    <p className="text-gray-600 mt-1">Discover our premium beauty and wellness treatments</p>
                  </div>
                </div>

                {/* Search and Filters */}
                <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Search services..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 border-purple-200 focus:border-purple-400 rounded-xl"
                        />
                      </div>
                      
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="border-purple-200 focus:border-purple-400 rounded-xl">
                          <Filter className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="hair">Hair Services</SelectItem>
                          <SelectItem value="facial">Facial Treatments</SelectItem>
                          <SelectItem value="nails">Nail Care</SelectItem>
                          <SelectItem value="wellness">Wellness</SelectItem>
                          <SelectItem value="beauty">Beauty</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="space-y-2">
                        <Label>Price Range: ${priceRange[0]} - ${priceRange[1]}</Label>
                        <Slider
                          value={priceRange}
                          onValueChange={setPriceRange}
                          max={300}
                          step={10}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Services Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredServices.map((service) => (
                    <Card key={service.id} className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 group">
                      <CardContent className="p-0">
                        <div className="relative h-48 overflow-hidden rounded-t-3xl">
                          <img
                            src={service.image}
                            alt={service.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute top-4 right-4">
                            <Badge className="bg-white/90 backdrop-blur-sm text-purple-700 border-0">
                              <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                              {service.rating}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg text-gray-900">{service.name}</h3>
                            <div className="text-right">
                              <p className="font-bold text-purple-600">${service.price}</p>
                              <p className="text-sm text-gray-500">{service.duration} min</p>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-4">{service.description}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="border-purple-200 text-purple-700 capitalize">
                              {service.category}
                            </Badge>
                            <Button
                              onClick={() => handleBookService(service)}
                              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl"
                            >
                              Book Now
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredServices.length === 0 && (
                  <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
                    <CardContent className="p-12 text-center">
                      <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
                      <p className="text-gray-600">Try adjusting your search criteria or browse all services</p>
                      <Button
                        onClick={() => {
                          setSearchTerm('');
                          setCategoryFilter('all');
                          setPriceRange([0, 300]);
                        }}
                        className="mt-4"
                        variant="outline"
                      >
                        Clear Filters
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {activeSection === 'appointments' && (
              <>
                {/* Appointments Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Appointments</h1>
                    <p className="text-gray-600 mt-1">Manage and track your salon appointments</p>
                  </div>
                  <Button
                    onClick={() => setActiveSection('services')}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Book New Appointment
                  </Button>
                </div>

                <Tabs defaultValue="upcoming" className="space-y-6">
                  <TabsList className="flex flex-col sm:grid sm:grid-cols-2 w-full h-auto gap-1 bg-purple-50 p-1 rounded-xl">
                    <TabsTrigger value="upcoming" className="w-full">Upcoming ({upcomingAppointments.length})</TabsTrigger>
                    <TabsTrigger value="past" className="w-full">Past ({pastAppointments.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="upcoming">
                    {upcomingAppointments.length > 0 ? (
                      <div className="space-y-4">
                        {upcomingAppointments.map((appointment) => (
                          <Card key={appointment.id} className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <div className="flex items-center gap-4 mb-2">
                                    <h3 className="font-bold text-xl text-gray-900">{appointment.service.name}</h3>
                                    <Badge className={`${getStatusColor(appointment.status)} border`}>
                                      {getStatusIcon(appointment.status)}
                                      <span className="ml-1 capitalize">{appointment.status}</span>
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-600">
                                    <div className="flex items-center">
                                      <Calendar className="w-4 h-4 mr-2" />
                                      <span>{format(new Date(appointment.date), 'MMMM d, yyyy')}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Clock className="w-4 h-4 mr-2" />
                                      <span>{appointment.time} • {appointment.service.duration} min</span>
                                    </div>
                                    <div className="flex items-center">
                                      <User className="w-4 h-4 mr-2" />
                                      <span>{appointment.staff.name}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-2xl text-purple-600">${appointment.service.price}</p>
                                  <p className="text-sm text-gray-500">Booking ID: {appointment.bookingId}</p>
                                </div>
                              </div>

                              {/* Status Progress */}
                              <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-gray-700">Appointment Status</span>
                                  <span className="text-sm text-gray-500">{getStatusProgress(appointment.status)}%</span>
                                </div>
                                <Progress value={getStatusProgress(appointment.status)} className="h-2" />
                              </div>

                              <div className="flex justify-between items-center">
                                <div className="text-sm text-gray-600">
                                  <p>Booked on {format(new Date(appointment.createdAt), 'MMM d, yyyy')}</p>
                                  {appointment.notes && <p className="mt-1">Note: {appointment.notes}</p>}
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-purple-600 border-purple-200 hover:bg-purple-50 rounded-xl hidden sm:flex"
                                    onClick={() => toast.success(`Reminder set! Added ${appointment.service.name} to your calendar.`)}
                                  >
                                    <Calendar className="w-4 h-4 mr-1" />
                                    Add to Calendar
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="rounded-xl"
                                    onClick={() => handleReschedule(appointment)}
                                  >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Reschedule
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-red-600 hover:bg-red-50 rounded-xl"
                                    onClick={() => handleCancelAppointment(appointment.id)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
                        <CardContent className="p-12 text-center">
                          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming appointments</h3>
                          <p className="text-gray-600 mb-4">Ready to book your next beauty session?</p>
                          <Button
                            onClick={() => setActiveSection('services')}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl"
                          >
                            Browse Services
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="past">
                    {pastAppointments.length > 0 ? (
                      <div className="space-y-4">
                        {pastAppointments.map((appointment) => (
                          <Card key={appointment.id} className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center gap-4 mb-2">
                                    <h3 className="font-bold text-xl text-gray-900">{appointment.service.name}</h3>
                                    <Badge className={`${getStatusColor(appointment.status)} border`}>
                                      {getStatusIcon(appointment.status)}
                                      <span className="ml-1 capitalize">{appointment.status}</span>
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-600">
                                    <div className="flex items-center">
                                      <Calendar className="w-4 h-4 mr-2" />
                                      <span>{format(new Date(appointment.date), 'MMMM d, yyyy')}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Clock className="w-4 h-4 mr-2" />
                                      <span>{appointment.time}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <User className="w-4 h-4 mr-2" />
                                      <span>{appointment.staff.name}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-xl text-gray-600">${appointment.service.price}</p>
                                  <div className="flex flex-col gap-2 mt-2">
                                    <Button
                                      onClick={() => handleBookService({ 
                                        name: appointment.service.name, 
                                        price: appointment.service.price,
                                        duration: appointment.service.duration,
                                        staff: [appointment.staff.name]
                                      })}
                                      size="sm"
                                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl"
                                    >
                                      Book Again
                                    </Button>
                                    
                                    {appointment.status === 'completed' && !appointment.rating && (
                                      <Button
                                        onClick={() => {
                                          setAppointmentToReview(appointment);
                                          setIsReviewDialogOpen(true);
                                        }}
                                        size="sm"
                                        variant="outline"
                                        className="rounded-xl border-purple-200 text-purple-600 hover:bg-purple-50"
                                      >
                                        <Star className="w-4 h-4 mr-1" /> Leave Review
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
                        <CardContent className="p-12 text-center">
                          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No past appointments</h3>
                          <p className="text-gray-600">Your appointment history will appear here after your first visit</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            )}

            {activeSection === 'notifications' && (
              <>
                {/* Notifications Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-gray-600 mt-2">Stay updated with your appointments and promotions</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                      setUnreadNotifications(0);
                      toast.success('All notifications marked as read');
                    }}
                    className="border-purple-200 text-purple-600 hover:bg-purple-50 rounded-xl"
                  >
                    Mark All Read
                  </Button>
                </div>

                <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
                  <CardContent className="p-0">
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-6 ${!notification.read ? 'bg-purple-50' : 'bg-white'} hover:bg-purple-50 transition-colors cursor-pointer first:rounded-t-3xl last:rounded-b-3xl`}
                            onClick={() => markNotificationAsRead(notification.id)}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                notification.type === 'confirmation' ? 'bg-green-100 text-green-600' :
                                notification.type === 'reminder' ? 'bg-blue-100 text-blue-600' :
                                notification.type === 'promotion' ? 'bg-purple-100 text-purple-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {notification.type === 'confirmation' && <CheckCircle2 className="w-5 h-5" />}
                                {notification.type === 'reminder' && <Clock className="w-5 h-5" />}
                                {notification.type === 'promotion' && <Star className="w-5 h-5" />}
                                {notification.type === 'completion' && <Zap className="w-5 h-5" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {notification.title}
                                  </h4>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">{notification.timestamp}</span>
                                    {!notification.read && (
                                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                    )}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 text-center">
                        <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                        <p className="text-gray-600">You're all caught up! Notifications will appear here.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>

        {/* Booking Dialog */}
        <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Book Appointment</DialogTitle>
              <DialogDescription>
                Schedule your {selectedService?.name} appointment
              </DialogDescription>
            </DialogHeader>
            {selectedService && (
              <div className="space-y-6">
                <div className="p-4 bg-purple-50 rounded-xl">
                  <h3 className="font-medium text-gray-900">{selectedService.name}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-600">{selectedService.duration} minutes</span>
                    <span className="font-bold text-purple-600">${selectedService.price}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Select Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal border-purple-200 focus:border-purple-400 rounded-xl"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarPicker
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          disabled={(date) => 
                            isBefore(date, startOfDay(new Date())) || 
                            date.getDay() === 0 // Disable Sundays
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>Select Time</Label>
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger className="border-purple-200 focus:border-purple-400 rounded-xl">
                        <SelectValue placeholder="Choose time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="09:00">9:00 AM</SelectItem>
                        <SelectItem value="10:00">10:00 AM</SelectItem>
                        <SelectItem value="11:00">11:00 AM</SelectItem>
                        <SelectItem value="14:00">2:00 PM</SelectItem>
                        <SelectItem value="15:00">3:00 PM</SelectItem>
                        <SelectItem value="16:00">4:00 PM</SelectItem>
                        <SelectItem value="17:00">5:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Select Professional</Label>
                    <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                      <SelectTrigger className="border-purple-200 focus:border-purple-400 rounded-xl">
                        <SelectValue placeholder="Any Available" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Any Available</SelectItem>
                        {staffMembers.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id.toString()}>{staff.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Special Requests (Optional)</Label>
                    <Textarea 
                      placeholder="Any special requests or notes for your appointment..." 
                      className="border-purple-200 focus:border-purple-400 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsBookingDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={confirmBooking}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                Confirm Booking
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reschedule Dialog */}
        <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Reschedule Appointment</DialogTitle>
              <DialogDescription>
                Choose a new date and time for your appointment
              </DialogDescription>
            </DialogHeader>
            {appointmentToReschedule && (
              <div className="space-y-6">
                <div className="p-4 bg-purple-50 rounded-xl">
                  <h3 className="font-medium text-gray-900">{appointmentToReschedule.service.name}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-600">Duration: {appointmentToReschedule.service.duration} minutes</span>
                    <span className="font-bold text-purple-600">${appointmentToReschedule.service.price}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    <p>Current: {format(new Date(appointmentToReschedule.date), 'MMMM d, yyyy')} at {appointmentToReschedule.time}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>New Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal border-purple-200 focus:border-purple-400 rounded-xl"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {rescheduleDate ? format(rescheduleDate, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarPicker
                          mode="single"
                          selected={rescheduleDate}
                          onSelect={(date) => date && setRescheduleDate(date)}
                          disabled={(date) => 
                            isBefore(date, startOfDay(new Date())) || 
                            date.getDay() === 0 // Disable Sundays
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>New Time</Label>
                    <Select value={rescheduleTime} onValueChange={setRescheduleTime}>
                      <SelectTrigger className="border-purple-200 focus:border-purple-400 rounded-xl">
                        <SelectValue placeholder="Choose time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="09:00">9:00 AM</SelectItem>
                        <SelectItem value="10:00">10:00 AM</SelectItem>
                        <SelectItem value="11:00">11:00 AM</SelectItem>
                        <SelectItem value="14:00">2:00 PM</SelectItem>
                        <SelectItem value="15:00">3:00 PM</SelectItem>
                        <SelectItem value="16:00">4:00 PM</SelectItem>
                        <SelectItem value="17:00">5:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsRescheduleDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={confirmReschedule}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                Confirm Reschedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Review Dialog */}
        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Rate Your Experience</DialogTitle>
              <DialogDescription>
                How was your {appointmentToReview?.service?.name} with {appointmentToReview?.staff?.name}?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 flex flex-col items-center">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="focus:outline-none"
                  >
                    <Star 
                      className={`w-8 h-8 ${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                    />
                  </button>
                ))}
              </div>
              <div className="w-full">
                <Label>Comments (Optional)</Label>
                <Textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share details of your experience..."
                  className="mt-2 border-purple-200 focus:border-purple-400 rounded-xl"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={submitReview}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                Submit Review
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}