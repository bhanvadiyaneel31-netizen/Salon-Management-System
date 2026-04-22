import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
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
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetFooter } from "./ui/sheet";
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
  Menu,
  Moon,
  Sun
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { toast } from "sonner";
import { format, addDays, startOfDay, isAfter, isBefore, formatDistanceToNow } from 'date-fns';
import { api, appointmentsAPI, servicesAPI, staffAPI, API_ORIGIN } from "../services/api";
import { safeFormatDate } from "./ui/utils";

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
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 300]);
  const [isUpdating, setIsUpdating] = useState(false);
  
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
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);


  // Review state
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [appointmentToReview, setAppointmentToReview] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  // Available Services & Staff Data
  const [services, setServices] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);

  // Customer Appointments Data
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [loyaltySettings, setLoyaltySettings] = useState<any>(null);
  const [loyaltyRewards, setLoyaltyRewards] = useState<any[]>([]);

  const loadLoyaltyData = async () => {
    try {
      const [history, settings, rewards] = await Promise.all([
        api.loyalty.getHistory(),
        api.loyalty.getSettings(),
        api.loyalty.getRewards()
      ]);
      setPointsHistory(history);
      setLoyaltySettings(settings);
      setLoyaltyRewards(rewards);
    } catch (error) {
      console.error('Failed to load loyalty data:', error);
    }
  };

  const loadAppointments = async () => {
    setLoadingAppointments(true);
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
    } finally {
      setLoadingAppointments(false);
    }
  };

  const loadProfile = async () => {
    try {
      const userData = await api.auth.getProfile();
      setProfile(prev => ({
        ...prev,
        name: userData.name || prev.name,
        email: userData.email || prev.email,
        phone: userData.phone || prev.phone,
        address: userData.address || prev.address,
        loyaltyPoints: userData.loyalty_points ?? 0,
        totalAppointments: userData.total_appointments ?? 0,
        joinDate: userData.created_at || prev.joinDate
      }));
      setProfileForm(prev => ({
        ...prev,
        name: userData.name || prev.name,
        email: userData.email || prev.email,
        phone: userData.phone || prev.phone,
        address: userData.address || prev.address
      }));
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const data = await api.notifications.getAll();
      setNotifications(data.map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        timestamp: formatDistanceToNow(new Date(n.created_at), { addSuffix: true }),
        read: !!n.is_read
      })));
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [servicesData, staffData] = await Promise.all([
          servicesAPI.getAll({ bookable: true }),
          staffAPI.getAll()
        ]);
        setServices(servicesData.map((s: any) => ({
          ...s,
          image: s.image_url ? `${API_ORIGIN}${s.image_url}` : `https://picsum.photos/seed/${(s.name || 'salon').replace(/\s+/g, '')}/400/300`,
          staff: s.assigned_staff?.length > 0 
            ? s.assigned_staff 
            : staffData.filter((st: any) => st.status === 'active' || st.is_available).map((st: any) => st.name)
        })));
        setStaffMembers(staffData.filter((s:any) => s.status === 'active' || s.is_available));
      } catch (err) {
        console.error('Failed to load services or staff:', err);
      }
      // Load all dynamic data from live backend
      await Promise.all([loadAppointments(), loadNotifications(), loadProfile(), loadLoyaltyData()]);
    };
    loadAllData();
    const interval = setInterval(() => {
      loadNotifications();
      loadAppointments();
      loadProfile(); // keep loyalty points & visit count in sync
      loadLoyaltyData();
    }, 10000); // 10s polling for real-time feel
    return () => clearInterval(interval);
  }, [activeSection]);

  const hasMarkedReadRef = useRef(false);

  // Mark all as read when entering notifications section
  useEffect(() => {
    if (activeSection === 'notifications') {
      const unreadCount = notifications.filter(n => !n.read).length;
      if (unreadCount > 0 && !hasMarkedReadRef.current) {
        const markAll = async () => {
          try {
            await api.notifications.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            hasMarkedReadRef.current = true;
          } catch (error) {
            console.error('Failed to mark all as read:', error);
          }
        };
        markAll();
      }
    } else {
      // Reset ref when leaving notifications section
      hasMarkedReadRef.current = false;
    }
  }, [activeSection, notifications]);

  const markAsRead = async (id: string) => {
    try {
      await api.notifications.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
       console.error('Failed to mark as read', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const [profile, setProfile] = useState({
    name: api.auth.getCurrentUser()?.name || 'Customer',
    email: api.auth.getCurrentUser()?.email || '',
    phone: api.auth.getCurrentUser()?.phone || '',
    address: api.auth.getCurrentUser()?.address || '',
    totalAppointments: 0,
    loyaltyPoints: 0,
    joinDate: api.auth.getCurrentUser()?.created_at || ''
  });

  const openProfileDialog = () => {
    const currentUser = api.auth.getCurrentUser();
    setProfileForm({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
      address: currentUser?.address || '',
      reminders: profileForm.reminders
    });
    setIsProfileDialogOpen(true);
  };

  const updateProfile = async () => {
    setIsUpdating(true);
    try {
      await api.auth.updateProfile({
        name: profileForm.name,
        phone: profileForm.phone,
        address: profileForm.address
      });
      await loadProfile(); // refresh profile from DB
      setIsProfileDialogOpen(false);
      toast.success("Profile updated successfully");
    } catch (err) {
      console.error('Failed to update profile:', err);
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const cancelAppointment = async (id: string) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      try {
        await appointmentsAPI.updateStatus(id, 'cancelled');
        setAppointments(prev => prev.map(apt => apt.id === id ? { ...apt, status: 'cancelled' } : apt));
        await loadProfile(); // refresh visit count
        toast.success("Appointment cancelled successfully");
      } catch (err) {
        console.error('Failed to cancel appointment:', err);
        toast.error("Failed to cancel appointment");
      }
    }
  };

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

  const handleRedeemPoints = async (points: number) => {
    toast.success(`Redeemed ${points} points for a $10 discount!`);
    setProfile(prev => ({
      ...prev,
      loyaltyPoints: Math.max(0, prev.loyaltyPoints - points)
    }));
    // Re-sync from server after a short delay to confirm the deduction
    setTimeout(() => loadProfile(), 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      case 'completed': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'in-progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const upcomingAppointments = appointments.filter(apt => {
    const date = new Date(apt.date);
    const today = new Date();
    return apt.status !== 'cancelled' && apt.status !== 'completed' && (isAfter(date, startOfDay(today)) || format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'));
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastAppointments = appointments.filter(apt => {
    const date = new Date(apt.date);
    const today = new Date();
    return apt.status === 'completed' || (isBefore(date, startOfDay(today)) && format(date, 'yyyy-MM-dd') !== format(today, 'yyyy-MM-dd'));
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleLogout = () => {
    api.auth.logout();
    setUserRole(null);
    setCurrentView('home');
  };

  const renderDashboard = () => (
    <div className="space-y-6">
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
              className="border-purple-200 bg-white/10 text-white hover:bg-white/20 rounded-xl"
            >
              <Calendar className="w-4 h-4 mr-2" />
              My Appointments
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Appointments</p>
              <p className="text-3xl font-bold text-gray-900">{profile.totalAppointments}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
              <Calendar className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Loyalty Points</p>
              <p className="text-3xl font-bold text-gray-900">{profile.loyaltyPoints}</p>
            </div>
            <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600">
              <Star className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Next Visit</p>
              <p className="text-xl font-bold text-gray-900">
                {upcomingAppointments.length > 0 
                  ? format(new Date(upcomingAppointments[0].date), 'MMM d, h:mm a')
                  : 'No upcoming visits'}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Recent Activity */}
         <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg">
           <CardHeader>
             <CardTitle className="text-lg font-bold text-gray-900">Recent Appointments</CardTitle>
           </CardHeader>
           <CardContent>
              <div className="space-y-4">
                {appointments.slice(0, 3).map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-purple-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                        <Scissors className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{apt.service.name}</p>
                        <p className="text-xs text-gray-500">{format(new Date(apt.date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(apt.status)} border text-[10px]`}>
                      {apt.status}
                    </Badge>
                  </div>
                ))}
              </div>
           </CardContent>
         </Card>

         {/* Latest News/Promos */}
         <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden relative">
           <div className="absolute top-0 right-0 p-6 opacity-10">
              <Sparkles className="w-32 h-32" />
           </div>
           <CardHeader>
             <CardTitle className="text-lg font-bold text-gray-900">Offers for You</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-100">
               <h4 className="font-bold text-purple-700">Spring Special 🌸</h4>
               <p className="text-xs text-purple-600 mt-1">Get 20% off on all Hair Spa services this month. Use code SPRING20.</p>
             </div>
             <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-100">
               <h4 className="font-bold text-blue-700">Refer a Friend</h4>
               <p className="text-xs text-blue-600 mt-1">Earn 50 loyalty points for every friend you refer!</p>
             </div>
           </CardContent>
         </Card>
      </div>
    </div>
  );

  const renderServices = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-gray-500">Find the perfect treatment for you</p>
        <div className="relative w-full sm:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
           <Input 
             placeholder="Search services..." 
             className="pl-10 border-purple-200 rounded-xl"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services
          .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((service) => (
            <Card key={service.id} className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden group hover:shadow-xl transition-all">
              <div className="aspect-video w-full overflow-hidden relative">
                <img src={service.image} alt={service.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                   <Badge className="bg-white/20 text-white backdrop-blur-md border-white/30 uppercase text-[10px]">
                     {service.category}
                   </Badge>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{service.name}</h3>
                  <span className="text-purple-600 font-bold">${service.price}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4 h-10">{service.description}</p>
                <div className="flex items-center justify-between">
                   <span className="text-xs text-gray-400 flex items-center gap-1">
                     <Clock className="w-3 h-3" />
                     {service.duration} mins
                   </span>
                   <Button 
                     size="sm" 
                     className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-8 px-4"
                     onClick={() => {
                        setPreselectedServiceId(String(service.id));
                        setCurrentView('booking');
                     }}
                   >Book</Button>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );

  const renderAppointments = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-gray-500">Manage your upcoming and past bookings</p>
        <Button
           variant="outline"
           size="sm"
           className="border-purple-200 text-purple-600 rounded-xl"
           onClick={() => loadAppointments()}
        >
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList className="bg-purple-50/50 p-1 rounded-2xl border border-purple-100">
          <TabsTrigger value="upcoming" className="rounded-xl px-8 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm">Upcoming</TabsTrigger>
          <TabsTrigger value="past" className="rounded-xl px-8 data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm">Past Visits</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
           {upcomingAppointments.length > 0 ? (
             upcomingAppointments.map((apt) => (
               <Card key={apt.id} className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden group">
                 <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-1/4 bg-gradient-to-br from-purple-500 to-pink-500 p-6 text-white flex flex-col justify-center items-center text-center">
                       <p className="text-sm uppercase tracking-widest opacity-80">{format(new Date(apt.date), 'MMMM')}</p>
                       <p className="text-4xl font-bold">{format(new Date(apt.date), 'dd')}</p>
                       <p className="font-medium mt-1">{apt.time}</p>
                    </div>
                    <CardContent className="flex-1 p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                         <div>
                           <Badge className={`${getStatusColor(apt.status)} border mb-2`}>{apt.status}</Badge>
                           <h3 className="text-xl font-bold text-gray-900">{apt.service.name}</h3>
                           <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                             <User className="w-4 h-4 text-purple-500" />
                             Professional: {apt.staff.name}
                           </p>
                         </div>
                         <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              className="rounded-xl border-purple-200 text-purple-600"
                              onClick={() => handleReschedule(apt)}
                            >Reschedule</Button>
                            <Button 
                              variant="ghost" 
                              className="rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600"
                              onClick={() => cancelAppointment(apt.id)}
                            >Cancel</Button>
                         </div>
                      </div>
                    </CardContent>
                 </div>
               </Card>
             ))
           ) : (
             <div className="text-center py-12 text-gray-500">
               <CalendarIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
               <p>No upcoming appointments found.</p>
               <Button 
                 variant="link" 
                 className="text-purple-600"
                 onClick={() => setCurrentView('booking')}
               >Book one now</Button>
             </div>
           )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
           {pastAppointments.map((apt) => (
             <Card key={apt.id} className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg group opacity-80 hover:opacity-100 transition-opacity">
               <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
                         <CheckCircle2 className="w-6 h-6" />
                       </div>
                       <div>
                         <h3 className="font-bold text-gray-900">{apt.service.name}</h3>
                         <p className="text-xs text-gray-500">{format(new Date(apt.date), 'MMM d, yyyy')} with {apt.staff.name}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       {apt.status === 'completed' && !apt.rating ? (
                         <Button 
                           size="sm" 
                           className="bg-purple-600 text-white rounded-xl h-8"
                           onClick={() => handleReview(apt)}
                         >Leave a Review</Button>
                       ) : apt.rating ? (
                         <div className="flex items-center gap-1 text-yellow-500">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < apt.rating ? 'fill-current' : 'text-gray-200'}`} />
                            ))}
                         </div>
                       ) : null}
                       <Button variant="ghost" size="sm" className="text-purple-600 hover:bg-purple-50 rounded-xl h-8">Rebook</Button>
                    </div>
                  </div>
               </CardContent>
             </Card>
           ))}
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-gray-500">Stay updated on your salon activity</p>
        <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-purple-600 hover:bg-purple-50 rounded-xl h-8">
           Mark all as read
        </Button>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <Card 
            key={n.id} 
            className={`border-0 rounded-2xl shadow-sm transition-all hover:shadow-md cursor-pointer ${!n.read ? 'bg-purple-50/50 border-l-4 border-l-purple-500' : 'bg-white'}`}
            onClick={() => markAsRead(n.id)}
          >
            <CardContent className="p-4 flex items-start gap-4">
               <div className={`p-2 rounded-xl shrink-0 ${!n.read ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
                 <Bell className="w-5 h-5" />
               </div>
               <div className="flex-1">
                 <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-sm font-bold ${!n.read ? 'text-purple-900' : 'text-gray-900'}`}>{n.title}</h4>
                    <span className="text-[10px] text-gray-400">{n.timestamp}</span>
                 </div>
                 <p className="text-xs text-gray-600 leading-relaxed">{n.message}</p>
               </div>
               {!n.read && <div className="mt-2 w-2 h-2 bg-purple-500 rounded-full shrink-0" />}
            </CardContent>
          </Card>
        ))}
        {notifications.length === 0 && (
          <div className="text-center py-12 text-gray-400">
             <Bell className="w-16 h-16 mx-auto mb-4 opacity-20" />
             <p>No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
       <div>
         <p className="text-gray-500">Manage your account and preferences</p>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-2 border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg">
           <CardHeader>
             <CardTitle className="text-lg font-bold">Personal Details</CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={profileForm.name} onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))} className="rounded-xl border-purple-200" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profileForm.email} disabled className="rounded-xl bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={profileForm.phone} onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))} className="rounded-xl border-purple-200" />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input value={profileForm.address} onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))} className="rounded-xl border-purple-200" />
                </div>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl h-11 shadow-md border-0"
                onClick={updateProfile}
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving Changes...' : 'Update Profile'}
              </Button>
           </CardContent>
         </Card>

         <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg h-fit">
           <CardContent className="p-6 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto flex items-center justify-center mb-4 border-4 border-white shadow-lg">
                <User className="w-12 h-12 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">{profile.name}</h3>
              <p className="text-sm text-gray-500">Member since {safeFormatDate(profile.joinDate, 'MMM yyyy')}</p>
              
              <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xl font-bold text-purple-600">{profile.loyaltyPoints}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Points</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-purple-600">{profile.totalAppointments}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Visits</p>
                </div>
              </div>
           </CardContent>
         </Card>
       </div>
    </div>
  );

  const renderLoyalty = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-gray-500">Track your points and redeem exclusive rewards</p>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">Total Balance</p>
          <p className="text-2xl font-bold text-purple-600 flex items-center justify-end gap-2">
            <Star className="w-6 h-6 fill-purple-600" />
            {profile.loyaltyPoints} pts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Points History</CardTitle>
            <CardDescription>Ledger of your earnings and redemptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pointsHistory.length > 0 ? (
                pointsHistory.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 hover:bg-white transition-all border border-transparent hover:border-purple-100">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${log.type === 'earn' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                        {log.type === 'earn' ? <TrendingUp className="w-5 h-5" /> : <TrendingUp className="w-5 h-5 rotate-180" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{log.reason || (log.type === 'earn' ? 'Service Reward' : 'Point Redemption')}</p>
                        <p className="text-[10px] text-gray-400">{format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}</p>
                      </div>
                    </div>
                    <p className={`font-bold ${log.type === 'earn' ? 'text-green-600' : 'text-amber-600'}`}>
                      {log.type === 'earn' ? '+' : '-'}{log.points}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-10" />
                  <p>No activity yet. Start booking to earn points!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-3xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">Reward Tiers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
               {/* Fixed Cashback Reward */}
               <div className="flex items-start gap-3">
                 <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">$</div>
                 <div>
                   <p className="font-bold text-sm">Point Redemption</p>
                   <p className="text-xs text-purple-100">100 pts = ${loyaltySettings ? (100 * loyaltySettings.redemption_rate).toFixed(0) : '10'} Discount</p>
                 </div>
               </div>

               {/* Dynamic Rewards from DB */}
               {loyaltyRewards.map((reward, idx) => (
                 <div key={reward.id} className="flex items-start gap-3">
                   <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">{idx + 1}</div>
                   <div>
                     <p className="font-bold text-sm">{reward.title}</p>
                     <p className="text-xs text-purple-100">{reward.points_required} pts = {reward.description || 'Special Offer'}</p>
                   </div>
                 </div>
               ))}
            </div>

            {loyaltyRewards.length > 0 && (
              <div className="pt-4 border-t border-white/20">
                <p className="text-[10px] uppercase tracking-widest opacity-80 mb-2">Next Milestone</p>
                {(() => {
                  const nextReward = loyaltyRewards.find(r => r.points_required > profile.loyaltyPoints) || loyaltyRewards[loyaltyRewards.length - 1];
                  const progress = Math.min((profile.loyaltyPoints / nextReward.points_required) * 100, 100);
                  return (
                    <>
                      <div className="flex justify-between text-xs mb-2">
                        <span>{profile.loyaltyPoints} pts</span>
                        <span>{nextReward.points_required} pts</span>
                      </div>
                      <Progress value={progress} className="h-1.5 bg-white/20" />
                    </>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return renderDashboard();
      case 'services': return renderServices();
      case 'appointments': return renderAppointments();
      case 'loyalty': return renderLoyalty();
      case 'notifications': return renderNotifications();
      case 'profile': return renderProfile();
      default: return renderDashboard();
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