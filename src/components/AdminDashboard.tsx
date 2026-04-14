import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "./ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Calendar as CalendarPicker } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Settings, 
  LogOut, 
  UserPlus,
  Scissors,
  MoreHorizontal,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Plus,
  Star,
  Phone,
  Mail,
  Clock,
  Award,
  Download,
  CalendarIcon,
  FileText,
  BarChart3,
  History,
  CheckCircle2,
  XCircle,
  AlertCircle,
  UserCog,
  Zap,
  Menu,
  X
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { toast } from "sonner";
import { exportToCSV } from "./ui/utils";
import { api, appointmentsAPI, analyticsAPI, staffAPI } from "../services/api";
import { ManageServicePanel } from "./ManageServicePanel";
import { format, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface AdminDashboardProps {
  setCurrentView: (view: string) => void;
  setUserRole: (role: string | null) => void;
}

export function AdminDashboard({ setCurrentView, setUserRole }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [manageServiceTab, setManageServiceTab] = useState<'services' | 'staff' | 'appointments'>('services');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditStaffOpen, setIsEditStaffOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);

  // Appointment Management State
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState('');
  const [appointmentDateFilter, setAppointmentDateFilter] = useState('all');
  const [appointmentStaffFilter, setAppointmentStaffFilter] = useState('all');
  const [appointmentServiceFilter, setAppointmentServiceFilter] = useState('all');
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isAppointmentDetailsOpen, setIsAppointmentDetailsOpen] = useState(false);
  const [isEditAppointmentOpen, setIsEditAppointmentOpen] = useState(false);
  const [isAssignStaffOpen, setIsAssignStaffOpen] = useState(false);
  const [appointmentHistoryTab, setAppointmentHistoryTab] = useState('upcoming');

  // Reports State
  const [reportType, setReportType] = useState('daily');
  const [reportDateRange, setReportDateRange] = useState({ from: new Date(), to: new Date() });
  const [selectedReportStaff, setSelectedReportStaff] = useState('all');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Staff members state — loaded from the real backend
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const loadStaff = async () => {
    setLoadingStaff(true);
    try {
      const data = await staffAPI.getAll();
      // Normalise backend shape to what the UI expects
      const normalized = data.map((s: any) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone || '',
        role: s.specialty || 'Staff',
        status: s.is_available ? 'active' : 'inactive',
        specialty: s.specialty || '',
        rating: s.rating ?? 0,
        appointments: 0,
        totalClients: 0,
        hoursWorked: 0,
        joinDate: s.created_at ? s.created_at.split('T')[0] : '',
        avatar: '/api/placeholder/40/40'
      }));
      setStaffMembers(normalized);
    } catch (err) {
      console.error('Failed to load staff:', err);
      toast.error('Failed to load staff members');
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => { loadStaff(); }, []);

  // Form states for add/edit staff
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: '',
    status: 'active' as const,
    specialty: ''
  });

  const handleLogout = () => {
    setUserRole(null);
    setCurrentView('home');
  };

  // Analytics state - loaded from real backend
  const [dailyAppointments, setDailyAppointments] = useState([
    { day: 'Mon', appointments: 0, revenue: 0 },
    { day: 'Tue', appointments: 0, revenue: 0 },
    { day: 'Wed', appointments: 0, revenue: 0 },
    { day: 'Thu', appointments: 0, revenue: 0 },
    { day: 'Fri', appointments: 0, revenue: 0 },
    { day: 'Sat', appointments: 0, revenue: 0 },
    { day: 'Sun', appointments: 0, revenue: 0 }
  ]);
  const [serviceDistribution, setServiceDistribution] = useState([
    { name: 'Hair Services', value: 0, color: '#8B5CF6' },
    { name: 'Facial Treatments', value: 0, color: '#EC4899' },
    { name: 'Nail Care', value: 0, color: '#06B6D4' },
    { name: 'Other', value: 0, color: '#10B981' }
  ]);
  const [dashboardStats, setDashboardStats] = useState({
    todayAppointments: 0,
    todayRevenue: 0,
    activeStaff: 0,
    growthRate: 0
  });
  const [mostBookedServices, setMostBookedServices] = useState<any[]>([]);

  // Load analytics on mount
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const [weekly, distribution, stats, servicePerf] = await Promise.all([
          analyticsAPI.getWeeklyData(),
          analyticsAPI.getServiceDistribution(),
          analyticsAPI.getDashboardStats(),
          analyticsAPI.getServicePerformance()
        ]);
        setDailyAppointments(weekly.map(d => ({ day: d.day, appointments: d.appointments, revenue: d.revenue })));
        setServiceDistribution(distribution);
        setDashboardStats(stats);
        
        // Map backend service performance to match the UI chart format
        const mappedServices = (servicePerf || []).map(s => ({
          id: s.service_id.toString(),
          service: s.service_name,
          bookings: s.total_bookings,
          revenue: s.total_revenue
        })).slice(0, 5); // top 5
        setMostBookedServices(mappedServices);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      }
    };
    loadAnalytics();
  }, []);

  // Load appointments from real backend
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  useEffect(() => {
    const loadAppointments = async () => {
      setLoadingAppointments(true);
      try {
        const data = await appointmentsAPI.getAll();
        // Normalize backend response to match AdminDashboard's expected shape
        const normalized = data.map((apt: any) => ({
          id: String(apt.id),
          customer: {
            name: apt.customer?.name || 'Unknown',
            email: apt.customer?.email || '',
            phone: apt.customer?.phone || ''
          },
          service: {
            name: apt.service?.name || '',
            duration: apt.service?.duration || 0,
            price: apt.price || 0
          },
          assignedStaff: apt.staff ? { id: apt.staff.id, name: apt.staff.name } : null,
          date: apt.appointment_date,
          time: apt.appointment_time,
          status: apt.status,
          notes: apt.notes || '',
          createdAt: apt.created_at,
          bookedBy: 'customer'
        }));
        setAppointments(normalized);
      } catch (err) {
        console.error('Failed to load appointments:', err);
      } finally {
        setLoadingAppointments(false);
      }
    };
    loadAppointments();
  }, []);

  const recentAppointments = appointments.slice(0, 4).map(apt => ({
    id: apt.id,
    customer: apt.customer.name,
    service: apt.service.name,
    staff: apt.assignedStaff?.name || 'Unassigned',
    time: apt.time,
    status: apt.status
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStaffStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Filter staff members based on search and filters
  const filteredStaff = staffMembers.filter(staff => {
    const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || staff.role.toLowerCase().includes(filterRole.toLowerCase());
    const matchesStatus = filterStatus === 'all' || staff.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const resetForm = () => {
    setStaffForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: '',
      status: 'active',
      specialty: ''
    });
  };

  const handleAddStaff = async () => {
    if (!staffForm.name || !staffForm.email || !staffForm.password) {
      toast.error('Please fill in name, email, and password');
      return;
    }
    try {
      await staffAPI.create({
        name: staffForm.name,
        email: staffForm.email,
        phone: staffForm.phone,
        password: staffForm.password,
        specialty: staffForm.specialty || staffForm.role,
        is_available: staffForm.status === 'active',
        rating: 0
      } as any);
      toast.success(`${staffForm.name} has been added to the team!`);
      resetForm();
      setIsAddStaffOpen(false);
      await loadStaff(); // re-fetch from DB
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add staff member');
    }
  };

  const handleEditStaff = () => {
    if (!editingStaff || !staffForm.name || !staffForm.email || !staffForm.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    setStaffMembers(prev => 
      prev.map(staff => 
        staff.id === editingStaff.id 
          ? { ...staff, ...staffForm }
          : staff
      )
    );
    
    resetForm();
    setEditingStaff(null);
    setIsEditStaffOpen(false);
    toast.success('Staff member updated successfully!');
  };

  const handleDeleteStaff = async (staffId: number) => {
    const staff = staffMembers.find(s => s.id === staffId);
    try {
      await staffAPI.delete(staffId);
      setStaffMembers(prev => prev.filter(s => s.id !== staffId));
      toast.success(`${staff?.name} has been permanently removed from the team`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete staff member');
    }
  };

  const openEditStaff = (staff: any) => {
    setEditingStaff(staff);
    setStaffForm({
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
      status: staff.status,
      specialty: staff.specialty
    });
    setIsEditStaffOpen(true);
  };

  const handleViewDetails = (staff: any) => {
    setSelectedStaff(staff);
    setIsDetailsOpen(true);
  };

  // Appointment Management Functions
  const updateAppointmentStatus = (appointmentId: string, newStatus: string) => {
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, status: newStatus }
          : apt
      )
    );
    const appointment = appointments.find(apt => apt.id === appointmentId);
    toast.success(`Appointment ${appointmentId} status updated to ${newStatus}`);
  };

  const assignStaffToAppointment = (appointmentId: string, staffId: number) => {
    const staff = staffMembers.find(s => s.id === staffId);
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, assignedStaff: { id: staffId, name: staff?.name || '' } }
          : apt
      )
    );
    toast.success(`${staff?.name} assigned to appointment ${appointmentId}`);
    setIsAssignStaffOpen(false);
  };

  const rescheduleAppointment = (appointmentId: string, newDate: string, newTime: string) => {
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, date: newDate, time: newTime }
          : apt
      )
    );
    toast.success(`Appointment ${appointmentId} rescheduled`);
    setIsEditAppointmentOpen(false);
  };

  const cancelAppointment = (appointmentId: string) => {
    updateAppointmentStatus(appointmentId, 'cancelled');
  };

  // Filter appointments based on search and filters
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = 
      appointment.customer.name.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
      appointment.id.toLowerCase().includes(appointmentSearchTerm.toLowerCase()) ||
      appointment.customer.email.toLowerCase().includes(appointmentSearchTerm.toLowerCase());

    const matchesDate = (() => {
      if (appointmentDateFilter === 'all') return true;
      const appointmentDate = new Date(appointment.date);
      const today = new Date();
      
      switch (appointmentDateFilter) {
        case 'today':
          return format(appointmentDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
        case 'tomorrow':
          return format(appointmentDate, 'yyyy-MM-dd') === format(addDays(today, 1), 'yyyy-MM-dd');
        case 'week':
          const weekStart = startOfWeek(today);
          const weekEnd = endOfWeek(today);
          return appointmentDate >= weekStart && appointmentDate <= weekEnd;
        case 'month':
          const monthStart = startOfMonth(today);
          const monthEnd = endOfMonth(today);
          return appointmentDate >= monthStart && appointmentDate <= monthEnd;
        default:
          return true;
      }
    })();

    const matchesStaff = appointmentStaffFilter === 'all' || 
      (appointment.assignedStaff && appointment.assignedStaff.id.toString() === appointmentStaffFilter) ||
      (appointmentStaffFilter === 'unassigned' && !appointment.assignedStaff);
    
    const matchesService = appointmentServiceFilter === 'all' || 
      appointment.service.name.toLowerCase().includes(appointmentServiceFilter.toLowerCase());
    
    const matchesStatus = appointmentStatusFilter === 'all' || 
      appointment.status === appointmentStatusFilter;

    return matchesSearch && matchesDate && matchesStaff && matchesService && matchesStatus;
  });

  // Separate appointments by status for history tabs
  const upcomingAppointments = filteredAppointments.filter(apt => 
    apt.status === 'pending' || apt.status === 'confirmed'
  );
  
  const completedAppointments = filteredAppointments.filter(apt => 
    apt.status === 'completed'
  );
  
  const cancelledAppointments = filteredAppointments.filter(apt => 
    apt.status === 'cancelled'
  );

  // Report generation functions
  const generateReport = async (type: string) => {
    setIsGeneratingReport(true);
    
    // Simulate report generation
    setTimeout(() => {
      toast.success(`${type} report generated successfully!`);
      setIsGeneratingReport(false);
    }, 2000);
  };

  const exportReport = (format: 'pdf' | 'excel') => {
    if (format === 'excel') {
      const exportData = appointments.map(apt => ({
        ID: apt.id,
        CustomerName: apt.customer?.name || 'N/A',
        CustomerEmail: apt.customer?.email || 'N/A',
        Service: apt.service?.name || 'N/A',
        Price: apt.service?.price || 0,
        Staff: apt.assignedStaff?.name || 'Unassigned',
        Date: apt.date,
        Time: apt.time,
        Status: apt.status,
      }));
      exportToCSV(exportData, 'salon_appointments_report.csv');
      toast.success('Report exported as EXCEL (CSV)!');
    } else {
      toast.success(`Report exported as PDF format! (Mock)`);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'manage-services', label: 'Manage Services', icon: Scissors },
    { id: 'staff', label: 'Manage Staff', icon: Users },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'reports', label: 'Reports', icon: DollarSign },
  ];

  const handleNavClick = (id: string) => {
    setActiveSection(id);
    if (id === 'manage-services') setManageServiceTab('services');
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">

      {/* Mobile Top Bar */}
      {/* Admin Panel Mobile Header (Non-sticky) */}
      <div className="lg:hidden px-4 md:px-6 pt-4 pb-2 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{activeSection.replace('-', ' ')}</p>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Slide Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-purple-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Admin Panel</p>
                  <p className="text-xs text-gray-500">Management Dashboard</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleNavClick(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    activeSection === id
                      ? 'bg-purple-50 text-purple-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-purple-100 px-2 py-2 flex items-center justify-around">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleNavClick(id)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors ${
              activeSection === id ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[9px] font-medium leading-none">{label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8 pb-24 lg:pb-8">
        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Sidebar — desktop only */}
          <div className="hidden lg:block lg:col-span-1">
            <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl sticky top-24">
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto flex items-center justify-center mb-4">
                  <Settings className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">Admin Panel</CardTitle>
                <p className="text-gray-600">Management Dashboard</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="ghost"
                  className={`w-full justify-start rounded-xl ${
                    activeSection === 'dashboard' 
                      ? 'text-purple-600 bg-purple-50' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveSection('dashboard')}
                >
                  <TrendingUp className="w-4 h-4 mr-3" />
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  className={`w-full justify-start rounded-xl ${
                    activeSection === 'manage-services' 
                      ? 'text-purple-600 bg-purple-50' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setActiveSection('manage-services');
                    setManageServiceTab('services');
                  }}
                >
                  <Scissors className="w-4 h-4 mr-3" />
                  Manage Services
                </Button>
                <Button
                  variant="ghost"
                  className={`w-full justify-start rounded-xl ${
                    activeSection === 'staff' 
                      ? 'text-purple-600 bg-purple-50' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveSection('staff')}
                >
                  <Users className="w-4 h-4 mr-3" />
                  Manage Staff
                </Button>
                <Button
                  variant="ghost"
                  className={`w-full justify-start rounded-xl ${
                    activeSection === 'appointments' 
                      ? 'text-purple-600 bg-purple-50' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveSection('appointments')}
                >
                  <Calendar className="w-4 h-4 mr-3" />
                  Appointments
                </Button>
                <Button
                  variant="ghost"
                  className={`w-full justify-start rounded-xl ${
                    activeSection === 'reports' 
                      ? 'text-purple-600 bg-purple-50' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setActiveSection('reports')}
                >
                  <DollarSign className="w-4 h-4 mr-3" />
                  Reports
                </Button>
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:bg-red-50 rounded-xl"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="col-span-full lg:col-span-4 space-y-6 lg:space-y-8">
            {activeSection === 'dashboard' && (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                  <Card className="border-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl shadow-xl text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100">Today's Appointments</p>
                          <p className="text-3xl font-bold">{dashboardStats.todayAppointments}</p>
                        </div>
                        <Calendar className="w-10 h-10 text-blue-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-r from-green-500 to-green-600 rounded-3xl shadow-xl text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100">Today's Revenue</p>
                          <p className="text-3xl font-bold">${dashboardStats.todayRevenue.toFixed(0)}</p>
                        </div>
                        <DollarSign className="w-10 h-10 text-green-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-3xl shadow-xl text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100">Active Staff</p>
                          <p className="text-3xl font-bold">{dashboardStats.activeStaff}</p>
                        </div>
                        <Users className="w-10 h-10 text-purple-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-r from-pink-500 to-pink-600 rounded-3xl shadow-xl text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-pink-100">Growth Rate</p>
                          <p className="text-3xl font-bold">+{dashboardStats.growthRate}%</p>
                        </div>
                        <TrendingUp className="w-10 h-10 text-pink-200" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid lg:grid-cols-2 gap-8">
                  <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-gray-900">Weekly Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dailyAppointments}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="appointments" fill="#8B5CF6" name="Appointments" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-gray-900">Service Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={serviceDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {serviceDistribution.map((entry) => (
                              <Cell key={`cell-${entry.name}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Appointments */}
                <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl font-bold text-gray-900">Recent Appointments</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-purple-200 text-purple-600 hover:bg-purple-50 rounded-xl"
                      onClick={() => setActiveSection('appointments')}
                    >
                      View All
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Staff</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recentAppointments.map((appointment) => (
                            <TableRow key={appointment.id}>
                              <TableCell className="font-medium">{appointment.customer}</TableCell>
                              <TableCell>{appointment.service}</TableCell>
                              <TableCell>{appointment.staff}</TableCell>
                              <TableCell>{appointment.time}</TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(appointment.status)}>
                                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                    <DropdownMenuItem>Edit</DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600">Cancel</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                      {recentAppointments.map((appointment) => (
                        <Card key={appointment.id} className="p-4 border-purple-100">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="font-medium text-gray-900">{appointment.customer}</div>
                              <div className="text-sm text-gray-500">{appointment.service}</div>
                            </div>
                            <Badge className={getStatusColor(appointment.status)}>
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mb-3 space-y-1">
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-purple-400" />
                              {appointment.staff}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-purple-400" />
                              {appointment.time}
                            </div>
                          </div>
                          <div className="flex justify-end border-t border-purple-50 pt-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 border-purple-200">
                                  Actions <MoreHorizontal className="h-4 w-4 ml-2" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">Cancel</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Staff Performance Overview */}
                <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl font-bold text-gray-900">Staff Performance Overview</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-purple-200 text-purple-600 hover:bg-purple-50 rounded-xl"
                      onClick={() => setActiveSection('staff')}
                    >
                      Manage Staff
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {staffMembers.slice(0, 4).map((staff) => (
                        <div key={staff.id} className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-bold text-lg text-gray-900">{staff.name}</h3>
                              <p className="text-gray-600">{staff.role}</p>
                            </div>
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                              ⭐ {staff.rating.toFixed(1)}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">This week: {staff.appointments} appointments</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-purple-600 hover:bg-purple-100"
                              onClick={() => handleViewDetails(staff)}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {activeSection === 'staff' && (
              <>
                {/* Staff Management Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Staff Management</h1>
                    <p className="text-gray-600 mt-1">Manage your salon's staff members and track their performance</p>
                  </div>
                  <Dialog open={isAddStaffOpen} onOpenChange={setIsAddStaffOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl">
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Staff
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add New Staff Member</DialogTitle>
                        <DialogDescription>
                          Enter the details for the new staff member below.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name *</Label>
                          <Input 
                            id="name" 
                            placeholder="Enter full name" 
                            value={staffForm.name}
                            onChange={(e) => setStaffForm(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input 
                            id="email" 
                            type="email" 
                            placeholder="Enter email address" 
                            value={staffForm.email}
                            onChange={(e) => setStaffForm(prev => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password *</Label>
                          <Input 
                            id="password" 
                            type="password" 
                            placeholder="Enter initial password" 
                            value={staffForm.password}
                            onChange={(e) => setStaffForm(prev => ({ ...prev, password: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input 
                            id="phone" 
                            type="tel" 
                            placeholder="Enter phone number" 
                            value={staffForm.phone}
                            onChange={(e) => setStaffForm(prev => ({ ...prev, phone: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="specialty">Specialty</Label>
                          <Input 
                            id="specialty" 
                            placeholder="Enter specialty (e.g., Hair Cutting & Styling)" 
                            value={staffForm.specialty}
                            onChange={(e) => setStaffForm(prev => ({ ...prev, specialty: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role">Role *</Label>
                          <Select value={staffForm.role} onValueChange={(value) => setStaffForm(prev => ({ ...prev, role: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Senior Stylist">Senior Stylist</SelectItem>
                              <SelectItem value="Hair Stylist">Hair Stylist</SelectItem>
                              <SelectItem value="Hair Colorist">Hair Colorist</SelectItem>
                              <SelectItem value="Nail Technician">Nail Technician</SelectItem>
                              <SelectItem value="Facial Specialist">Facial Specialist</SelectItem>
                              <SelectItem value="Massage Therapist">Massage Therapist</SelectItem>
                              <SelectItem value="Receptionist">Receptionist</SelectItem>
                              <SelectItem value="Cleaner">Cleaner</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch 
                            id="active" 
                            checked={staffForm.status === 'active'}
                            onCheckedChange={(checked) => setStaffForm(prev => ({ ...prev, status: checked ? 'active' : 'inactive' }))}
                          />
                          <Label htmlFor="active">Active Status</Label>
                        </div>
                      </div>
                      <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => {
                          setIsAddStaffOpen(false);
                          resetForm();
                        }}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddStaff} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                          Add Staff Member
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                  <Card className="border-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl shadow-xl text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100">Total Staff</p>
                          <p className="text-3xl font-bold">{staffMembers.length}</p>
                        </div>
                        <Users className="w-10 h-10 text-blue-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-r from-green-500 to-green-600 rounded-3xl shadow-xl text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100">Active Staff</p>
                          <p className="text-3xl font-bold">{staffMembers.filter(s => s.status === 'active').length}</p>
                        </div>
                        <Award className="w-10 h-10 text-green-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-3xl shadow-xl text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100">Avg Rating</p>
                          <p className="text-3xl font-bold">{staffMembers.length > 0 ? (staffMembers.reduce((acc, s) => acc + s.rating, 0) / staffMembers.length).toFixed(1) : '0.0'}</p>
                        </div>
                        <Star className="w-10 h-10 text-purple-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-r from-pink-500 to-pink-600 rounded-3xl shadow-xl text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-pink-100">Total Hours</p>
                          <p className="text-3xl font-bold">{staffMembers.reduce((acc, s) => acc + s.hoursWorked, 0)}</p>
                        </div>
                        <Clock className="w-10 h-10 text-pink-200" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Search and Filter */}
                <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Search staff by name, email, or role..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 border-purple-200 focus:border-purple-400 rounded-xl"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Select value={filterRole} onValueChange={setFilterRole}>
                          <SelectTrigger className="w-40 border-purple-200 focus:border-purple-400 rounded-xl">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="stylist">Stylist</SelectItem>
                            <SelectItem value="specialist">Specialist</SelectItem>
                            <SelectItem value="technician">Technician</SelectItem>
                            <SelectItem value="receptionist">Receptionist</SelectItem>
                            <SelectItem value="colorist">Colorist</SelectItem>
                            <SelectItem value="therapist">Therapist</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger className="w-32 border-purple-200 focus:border-purple-400 rounded-xl">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Staff Table */}
                <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900">Staff Members ({filteredStaff.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <div className="hidden md:block">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Staff ID</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Appointments</TableHead>
                              <TableHead>Rating</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredStaff.map((staff) => (
                              <TableRow key={staff.id}>
                                <TableCell className="font-medium">#{staff.id.toString().padStart(3, '0')}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-sm font-bold">
                                        {staff.name.split(' ').map(n => n[0]).join('')}
                                      </span>
                                    </div>
                                    <div>
                                      <div className="font-medium">{staff.name}</div>
                                      <div className="text-sm text-gray-500">{staff.specialty}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>{staff.email}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="border-purple-200 text-purple-700">
                                    {staff.role}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getStaffStatusColor(staff.status)}>
                                    {staff.status.charAt(0).toUpperCase() + staff.status.slice(1)}
                                  </Badge>
                                </TableCell>
                                <TableCell>{staff.appointments}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    <span className="font-medium">{staff.rating.toFixed(1)}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                                      onClick={() => handleViewDetails(staff)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-purple-600 hover:bg-purple-50"
                                      onClick={() => openEditStaff(staff)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Remove Staff Member</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to remove {staff.name} from the staff? This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDeleteStaff(staff.id)}
                                            className="bg-red-600 hover:bg-red-700"
                                          >
                                            Remove Staff
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4 md:hidden">
                        {filteredStaff.map((staff) => (
                          <Card key={staff.id} className="p-4 border-purple-100">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-bold">
                                    {staff.name.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{staff.name}</div>
                                  <div className="text-sm text-gray-500">#{staff.id.toString().padStart(3, '0')}</div>
                                </div>
                              </div>
                              <Badge className={getStaffStatusColor(staff.status)}>
                                {staff.status.charAt(0).toUpperCase() + staff.status.slice(1)}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                              <div>
                                <span className="text-gray-500 block">Role</span>
                                <span className="font-medium">{staff.role}</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block">Rating</span>
                                <span className="font-medium flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {staff.rating.toFixed(1)}
                                </span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-gray-500 block">Email</span>
                                <span className="font-medium">{staff.email}</span>
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end pt-3 border-t border-purple-50">
                              <Button variant="outline" size="sm" className="flex-1 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100" onClick={() => handleViewDetails(staff)}>
                                <Eye className="h-4 w-4 mr-2" /> View
                              </Button>
                              <Button variant="outline" size="sm" className="flex-1 bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100" onClick={() => openEditStaff(staff)}>
                                <Edit className="h-4 w-4 mr-2" /> Edit
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="flex-1 bg-red-50 text-red-600 border-red-200 hover:bg-red-100">
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove Staff Member</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to remove {staff.name} from the staff? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteStaff(staff.id)} className="bg-red-600 hover:bg-red-700">
                                      Remove Staff
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </Card>
                        ))}
                      </div>
                      {filteredStaff.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No staff members found matching your search criteria.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {activeSection === 'manage-services' && (
              <ManageServicePanel defaultTab={manageServiceTab} />
            )}

            {activeSection === 'appointments' && (
              <>
                {/* Appointment Management Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Appointment Management</h1>
                    <p className="text-gray-600 mt-2">Manage all salon appointments and bookings</p>
                  </div>
                </div>

                {/* Appointment Stats */}
                <div className="grid md:grid-cols-4 gap-6">
                  <Card className="border-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl shadow-xl text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100">Total Appointments</p>
                          <p className="text-3xl font-bold">{appointments.length}</p>
                        </div>
                        <Calendar className="w-10 h-10 text-blue-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-r from-green-500 to-green-600 rounded-3xl shadow-xl text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100">Confirmed</p>
                          <p className="text-3xl font-bold">{appointments.filter(a => a.status === 'confirmed').length}</p>
                        </div>
                        <CheckCircle2 className="w-10 h-10 text-green-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-3xl shadow-xl text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-yellow-100">Pending</p>
                          <p className="text-3xl font-bold">{appointments.filter(a => a.status === 'pending').length}</p>
                        </div>
                        <AlertCircle className="w-10 h-10 text-yellow-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-3xl shadow-xl text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100">Unassigned</p>
                          <p className="text-3xl font-bold">{appointments.filter(a => !a.assignedStaff).length}</p>
                        </div>
                        <UserCog className="w-10 h-10 text-purple-200" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Search and Filters */}
                <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                      <div className="lg:col-span-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <Input
                            placeholder="Search by customer name, booking ID, or email..."
                            value={appointmentSearchTerm}
                            onChange={(e) => setAppointmentSearchTerm(e.target.value)}
                            className="pl-10 border-purple-200 focus:border-purple-400 rounded-xl"
                          />
                        </div>
                      </div>
                      
                      <Select value={appointmentDateFilter} onValueChange={setAppointmentDateFilter}>
                        <SelectTrigger className="border-purple-200 focus:border-purple-400 rounded-xl">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Date" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Dates</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="tomorrow">Tomorrow</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={appointmentStaffFilter} onValueChange={setAppointmentStaffFilter}>
                        <SelectTrigger className="border-purple-200 focus:border-purple-400 rounded-xl">
                          <Users className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Staff" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Staff</SelectItem>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {staffMembers.filter(s => s.status === 'active').map(staff => (
                            <SelectItem key={staff.id} value={staff.id.toString()}>{staff.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={appointmentServiceFilter} onValueChange={setAppointmentServiceFilter}>
                        <SelectTrigger className="border-purple-200 focus:border-purple-400 rounded-xl">
                          <Scissors className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Service" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Services</SelectItem>
                          <SelectItem value="hair">Hair Services</SelectItem>
                          <SelectItem value="facial">Facial</SelectItem>
                          <SelectItem value="nail">Nail Care</SelectItem>
                          <SelectItem value="massage">Massage</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={appointmentStatusFilter} onValueChange={setAppointmentStatusFilter}>
                        <SelectTrigger className="border-purple-200 focus:border-purple-400 rounded-xl">
                          <Filter className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Appointment History Tabs */}
                <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900">Appointment History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={appointmentHistoryTab} onValueChange={setAppointmentHistoryTab}>
                      <TabsList className="flex flex-col sm:grid sm:grid-cols-3 w-full h-auto gap-1 bg-purple-50 p-1 rounded-xl">
                        <TabsTrigger value="upcoming" className="w-full">Upcoming ({upcomingAppointments.length})</TabsTrigger>
                        <TabsTrigger value="completed" className="w-full">Completed ({completedAppointments.length})</TabsTrigger>
                        <TabsTrigger value="cancelled" className="w-full">Cancelled ({cancelledAppointments.length})</TabsTrigger>
                      </TabsList>

                      <TabsContent value="upcoming" className="mt-6">
                        <div className="hidden md:block overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Booking ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Service</TableHead>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Assigned Staff</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {upcomingAppointments.map((appointment) => (
                                <TableRow key={appointment.id}>
                                  <TableCell className="font-medium">{appointment.id}</TableCell>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">{appointment.customer.name}</div>
                                      <div className="text-sm text-gray-500">{appointment.customer.phone}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">{appointment.service.name}</div>
                                      <div className="text-sm text-gray-500">${appointment.service.price} • {appointment.service.duration}min</div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">{format(new Date(appointment.date), 'MMM d, yyyy')}</div>
                                      <div className="text-sm text-gray-500">{appointment.time}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {appointment.assignedStaff ? (
                                      <Badge variant="outline" className="border-green-200 text-green-700">
                                        {appointment.assignedStaff.name}
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="border-red-200 text-red-700">
                                        Unassigned
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={getStatusColor(appointment.status)}>
                                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => {
                                          setSelectedAppointment(appointment);
                                          setIsAppointmentDetailsOpen(true);
                                        }}>
                                          <Eye className="w-4 h-4 mr-2" />
                                          View Details
                                        </DropdownMenuItem>
                                        {!appointment.assignedStaff && (
                                          <DropdownMenuItem onClick={() => {
                                            setSelectedAppointment(appointment);
                                            setIsAssignStaffOpen(true);
                                          }}>
                                            <UserCog className="w-4 h-4 mr-2" />
                                            Assign Staff
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => {
                                          setSelectedAppointment(appointment);
                                          setIsEditAppointmentOpen(true);
                                        }}>
                                          <Edit className="w-4 h-4 mr-2" />
                                          Reschedule
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                                          disabled={appointment.status === 'confirmed'}
                                        >
                                          <CheckCircle2 className="w-4 h-4 mr-2" />
                                          Confirm
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                                          disabled={appointment.status === 'completed'}
                                        >
                                          <Zap className="w-4 h-4 mr-2" />
                                          Mark Complete
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => cancelAppointment(appointment.id)}
                                          className="text-red-600"
                                        >
                                          <XCircle className="w-4 h-4 mr-2" />
                                          Cancel
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4 md:hidden mt-4">
                          {upcomingAppointments.map((appointment) => (
                            <Card key={appointment.id} className="p-4 border-purple-100">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <div className="font-medium text-gray-900">{appointment.customer.name}</div>
                                  <div className="text-sm text-gray-500">{appointment.id}</div>
                                </div>
                                <Badge className={getStatusColor(appointment.status)}>
                                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                <div className="col-span-2">
                                  <span className="text-gray-500 block">Service</span>
                                  <span className="font-medium">{appointment.service.name} (${appointment.service.price})</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">Date & Time</span>
                                  <span className="font-medium">{format(new Date(appointment.date), 'MMM d, yyyy')} • {appointment.time}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">Staff</span>
                                  {appointment.assignedStaff ? (
                                    <span className="font-medium text-green-600">{appointment.assignedStaff.name}</span>
                                  ) : (
                                    <span className="font-medium text-red-600">Unassigned</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2 justify-end pt-3 border-t border-purple-50">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="w-full border-purple-200 text-purple-600">
                                      Manage Booking <MoreHorizontal className="h-4 w-4 ml-2" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuItem onClick={() => {
                                      setSelectedAppointment(appointment);
                                      setIsAppointmentDetailsOpen(true);
                                    }}>
                                      <Eye className="w-4 h-4 mr-2" /> View Details
                                    </DropdownMenuItem>
                                    {!appointment.assignedStaff && (
                                      <DropdownMenuItem onClick={() => {
                                        setSelectedAppointment(appointment);
                                        setIsAssignStaffOpen(true);
                                      }}>
                                        <UserCog className="w-4 h-4 mr-2" /> Assign Staff
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => {
                                      setSelectedAppointment(appointment);
                                      setIsEditAppointmentOpen(true);
                                    }}>
                                      <Edit className="w-4 h-4 mr-2" /> Reschedule
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                                      disabled={appointment.status === 'confirmed'}
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                                      disabled={appointment.status === 'completed'}
                                    >
                                      <Zap className="w-4 h-4 mr-2" /> Mark Complete
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => cancelAppointment(appointment.id)}
                                      className="text-red-600"
                                    >
                                      <XCircle className="w-4 h-4 mr-2" /> Cancel
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </Card>
                          ))}
                        </div>
                        
                        {upcomingAppointments.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-lg">No upcoming appointments found</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="completed" className="mt-6">
                        <div className="hidden md:block overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Booking ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Service</TableHead>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Staff</TableHead>
                                <TableHead>Revenue</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {completedAppointments.map((appointment) => (
                                <TableRow key={appointment.id}>
                                  <TableCell className="font-medium">{appointment.id}</TableCell>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">{appointment.customer.name}</div>
                                      <div className="text-sm text-gray-500">{appointment.customer.email}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell>{appointment.service.name}</TableCell>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">{format(new Date(appointment.date), 'MMM d, yyyy')}</div>
                                      <div className="text-sm text-gray-500">{appointment.time}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell>{appointment.assignedStaff?.name}</TableCell>
                                  <TableCell>
                                    <span className="font-medium text-green-600">${appointment.service.price}</span>
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedAppointment(appointment);
                                        setIsAppointmentDetailsOpen(true);
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4 md:hidden mt-4">
                          {completedAppointments.map((appointment) => (
                            <Card key={appointment.id} className="p-4 border-purple-100">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <div className="font-medium text-gray-900">{appointment.customer.name}</div>
                                  <div className="text-sm text-gray-500">{appointment.id}</div>
                                </div>
                                <span className="font-bold text-green-600">${appointment.service.price}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                <div className="col-span-2">
                                  <span className="text-gray-500 block">Service</span>
                                  <span className="font-medium">{appointment.service.name}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">Date & Time</span>
                                  <span className="font-medium">{format(new Date(appointment.date), 'MMM d, yyyy')} <br/> {appointment.time}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">Staff</span>
                                  <span className="font-medium">{appointment.assignedStaff?.name}</span>
                                </div>
                              </div>
                              <div className="flex justify-end pt-3 border-t border-purple-50">
                                <Button variant="outline" size="sm" className="w-full text-blue-600 bg-blue-50 hover:bg-blue-100" onClick={() => {
                                  setSelectedAppointment(appointment);
                                  setIsAppointmentDetailsOpen(true);
                                }}>
                                  <Eye className="w-4 h-4 mr-2" /> View Details
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                        
                        {completedAppointments.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-lg">No completed appointments found</p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="cancelled" className="mt-6">
                        <div className="hidden md:block overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Booking ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Service</TableHead>
                                <TableHead>Original Date</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {cancelledAppointments.map((appointment) => (
                                <TableRow key={appointment.id}>
                                  <TableCell className="font-medium">{appointment.id}</TableCell>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">{appointment.customer.name}</div>
                                      <div className="text-sm text-gray-500">{appointment.customer.phone}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell>{appointment.service.name}</TableCell>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">{format(new Date(appointment.date), 'MMM d, yyyy')}</div>
                                      <div className="text-sm text-gray-500">{appointment.time}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm text-gray-600">{appointment.notes || 'No reason provided'}</span>
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedAppointment(appointment);
                                        setIsAppointmentDetailsOpen(true);
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4 md:hidden mt-4">
                          {cancelledAppointments.map((appointment) => (
                            <Card key={appointment.id} className="p-4 border-red-100 bg-red-50/30">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <div className="font-medium text-gray-900">{appointment.customer.name}</div>
                                  <div className="text-sm text-gray-500">{appointment.id}</div>
                                </div>
                                <Badge className="bg-red-100 text-red-700">Cancelled</Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                <div className="col-span-2">
                                  <span className="text-gray-500 block">Service</span>
                                  <span className="font-medium">{appointment.service.name}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block">Date & Time</span>
                                  <span className="font-medium">{format(new Date(appointment.date), 'MMM d, yyyy')} <br/> {appointment.time}</span>
                                </div>
                                <div className="col-span-2 mt-2">
                                  <span className="text-gray-500 block">Reason</span>
                                  <span className="font-medium text-gray-700">{appointment.notes || 'No reason provided'}</span>
                                </div>
                              </div>
                              <div className="flex justify-end pt-3 border-t border-red-100">
                                <Button variant="outline" size="sm" className="w-full text-gray-700 hover:bg-gray-100" onClick={() => {
                                  setSelectedAppointment(appointment);
                                  setIsAppointmentDetailsOpen(true);
                                }}>
                                  <Eye className="w-4 h-4 mr-2" /> View Details
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                        
                        {cancelledAppointments.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <XCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-lg">No cancelled appointments found</p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </>
            )}

            {activeSection === 'reports' && (
              <>
                {/* Reports Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                    <p className="text-gray-600 mt-2">Generate comprehensive business reports and analytics</p>
                  </div>
                </div>

                {/* Report Generation */}
                <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900">Generate Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger className="border-purple-200 focus:border-purple-400 rounded-xl">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Report Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily Report</SelectItem>
                          <SelectItem value="weekly">Weekly Report</SelectItem>
                          <SelectItem value="monthly">Monthly Report</SelectItem>
                          <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={selectedReportStaff} onValueChange={setSelectedReportStaff}>
                        <SelectTrigger className="border-purple-200 focus:border-purple-400 rounded-xl">
                          <Users className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Staff Member" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Staff</SelectItem>
                          {staffMembers.filter(s => s.status === 'active').map(staff => (
                            <SelectItem key={staff.id} value={staff.id.toString()}>{staff.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button 
                        onClick={() => generateReport(reportType)}
                        disabled={isGeneratingReport}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl"
                      >
                        {isGeneratingReport ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 mr-2" />
                            Generate Report
                          </>
                        )}
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50 rounded-xl">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => exportReport('pdf')}>
                            <FileText className="w-4 h-4 mr-2" />
                            Export as PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportReport('excel')}>
                            <Download className="w-4 h-4 mr-2" />
                            Export as Excel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>

                {/* Report Statistics */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="border-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl shadow-xl text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100">Total Appointments</p>
                          <p className="text-3xl font-bold">{appointments.length}</p>
                          <p className="text-blue-200 text-sm">This month</p>
                        </div>
                        <Calendar className="w-10 h-10 text-blue-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-r from-green-500 to-green-600 rounded-3xl shadow-xl text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100">Total Revenue</p>
                          <p className="text-3xl font-bold">${appointments.filter(a => a.status === 'completed').reduce((sum, a) => sum + a.service.price, 0)}</p>
                          <p className="text-green-200 text-sm">This month</p>
                        </div>
                        <DollarSign className="w-10 h-10 text-green-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-r from-purple-500 to-purple-600 rounded-3xl shadow-xl text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100">Completion Rate</p>
                          <p className="text-3xl font-bold">{Math.round((appointments.filter(a => a.status === 'completed').length / appointments.length) * 100)}%</p>
                          <p className="text-purple-200 text-sm">This month</p>
                        </div>
                        <TrendingUp className="w-10 h-10 text-purple-200" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 bg-gradient-to-r from-pink-500 to-pink-600 rounded-3xl shadow-xl text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-pink-100">Avg Service Value</p>
                          <p className="text-3xl font-bold">${Math.round(appointments.reduce((sum, a) => sum + a.service.price, 0) / appointments.length)}</p>
                          <p className="text-pink-200 text-sm">Per appointment</p>
                        </div>
                        <Star className="w-10 h-10 text-pink-200" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Service Performance Chart */}
                <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900">Most Booked Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={mostBookedServices}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="service" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="bookings" fill="#8B5CF6" name="Bookings" />
                        <Bar dataKey="revenue" fill="#EC4899" name="Revenue ($)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Staff Performance */}
                <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900">Staff Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Staff Member</TableHead>
                            <TableHead>Appointments Handled</TableHead>
                            <TableHead>Completion Rate</TableHead>
                            <TableHead>Revenue Generated</TableHead>
                            <TableHead>Average Rating</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {staffMembers.filter(s => s.status === 'active' && s.appointments > 0).map((staff) => {
                            const staffAppointments = appointments.filter(a => a.assignedStaff?.id === staff.id);
                            const completedAppointments = staffAppointments.filter(a => a.status === 'completed');
                            const completionRate = staffAppointments.length > 0 ? Math.round((completedAppointments.length / staffAppointments.length) * 100) : 0;
                            const revenue = completedAppointments.reduce((sum, a) => sum + a.service.price, 0);
                            
                            return (
                              <TableRow key={staff.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                      <span className="text-white text-sm font-bold">
                                        {staff.name.split(' ').map(n => n[0]).join('')}
                                      </span>
                                    </div>
                                    <div>
                                      <div className="font-medium">{staff.name}</div>
                                      <div className="text-sm text-gray-500">{staff.role}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>{staffAppointments.length}</TableCell>
                                <TableCell>
                                  <Badge variant={completionRate >= 80 ? "default" : "secondary"} className={completionRate >= 80 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                                    {completionRate}%
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="font-medium text-green-600">${revenue}</span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    <span className="font-medium">{staff.rating.toFixed(1)}</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                      {staffMembers.filter(s => s.status === 'active' && s.appointments > 0).map((staff) => {
                        const staffAppointments = appointments.filter(a => a.assignedStaff?.id === staff.id);
                        const completedAppointments = staffAppointments.filter(a => a.status === 'completed');
                        const completionRate = staffAppointments.length > 0 ? Math.round((completedAppointments.length / staffAppointments.length) * 100) : 0;
                        const revenue = completedAppointments.reduce((sum, a) => sum + a.service.price, 0);
                        
                        return (
                          <Card key={staff.id} className="p-4 border-purple-100">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white font-bold">
                                    {staff.name.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{staff.name}</div>
                                  <div className="text-sm text-gray-500">{staff.role}</div>
                                </div>
                              </div>
                              <Badge variant={completionRate >= 80 ? "default" : "secondary"} className={completionRate >= 80 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                                {completionRate}%
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-500 block">Appointments</span>
                                <span className="font-medium">{staffAppointments.length} Handled</span>
                              </div>
                              <div>
                                <span className="text-gray-500 block">Revenue</span>
                                <span className="font-medium text-green-600">${revenue}</span>
                              </div>
                              <div className="col-span-2 mt-1 pt-2 border-t border-purple-50 flex justify-between items-center">
                                <span className="text-gray-500">Average Rating</span>
                                <span className="font-medium flex items-center gap-1">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  {staff.rating.toFixed(1)}
                                </span>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Revenue Trends */}
                <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900">Revenue Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={[
                        { month: 'Jan', revenue: 15400, appointments: 125 },
                        { month: 'Feb', revenue: 18200, appointments: 142 },
                        { month: 'Mar', revenue: 21800, appointments: 168 },
                        { month: 'Apr', revenue: 19600, appointments: 156 },
                        { month: 'May', revenue: 23400, appointments: 178 },
                        { month: 'Jun', revenue: 26800, appointments: 195 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={3} name="Revenue ($)" />
                        <Line type="monotone" dataKey="appointments" stroke="#EC4899" strokeWidth={3} name="Appointments" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Edit Staff Dialog */}
            <Dialog open={isEditStaffOpen} onOpenChange={setIsEditStaffOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Staff Member</DialogTitle>
                  <DialogDescription>
                    Update the details for {editingStaff?.name || 'this staff member'}.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Full Name *</Label>
                    <Input 
                      id="edit-name" 
                      placeholder="Enter full name" 
                      value={staffForm.name}
                      onChange={(e) => setStaffForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email *</Label>
                    <Input 
                      id="edit-email" 
                      type="email" 
                      placeholder="Enter email address" 
                      value={staffForm.email}
                      onChange={(e) => setStaffForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Phone</Label>
                    <Input 
                      id="edit-phone" 
                      type="tel" 
                      placeholder="Enter phone number" 
                      value={staffForm.phone}
                      onChange={(e) => setStaffForm(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-specialty">Specialty</Label>
                    <Input 
                      id="edit-specialty" 
                      placeholder="Enter specialty" 
                      value={staffForm.specialty}
                      onChange={(e) => setStaffForm(prev => ({ ...prev, specialty: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-role">Role *</Label>
                    <Select value={staffForm.role} onValueChange={(value) => setStaffForm(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Senior Stylist">Senior Stylist</SelectItem>
                        <SelectItem value="Hair Stylist">Hair Stylist</SelectItem>
                        <SelectItem value="Hair Colorist">Hair Colorist</SelectItem>
                        <SelectItem value="Nail Technician">Nail Technician</SelectItem>
                        <SelectItem value="Facial Specialist">Facial Specialist</SelectItem>
                        <SelectItem value="Massage Therapist">Massage Therapist</SelectItem>
                        <SelectItem value="Receptionist">Receptionist</SelectItem>
                        <SelectItem value="Cleaner">Cleaner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="edit-active" 
                      checked={staffForm.status === 'active'}
                      onCheckedChange={(checked) => setStaffForm(prev => ({ ...prev, status: checked ? 'active' : 'inactive' }))}
                    />
                    <Label htmlFor="edit-active">Active Status</Label>
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => {
                    setIsEditStaffOpen(false);
                    setEditingStaff(null);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditStaff} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    Update Staff Member
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Staff Details Sheet */}
            <Sheet open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Staff Details</SheetTitle>
                  <SheetDescription>
                    Complete profile and performance information
                  </SheetDescription>
                </SheetHeader>
                {selectedStaff && (
                  <div className="space-y-6 mt-6">
                    {/* Profile Section */}
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto flex items-center justify-center mb-4">
                        <span className="text-white text-2xl font-bold">
                          {selectedStaff.name.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{selectedStaff.name}</h3>
                      <p className="text-gray-600">{selectedStaff.role}</p>
                      <Badge className={getStaffStatusColor(selectedStaff.status)} variant="secondary">
                        {selectedStaff.status.charAt(0).toUpperCase() + selectedStaff.status.slice(1)}
                      </Badge>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Contact Information</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{selectedStaff.email}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{selectedStaff.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Performance Metrics</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-purple-50 p-3 rounded-xl text-center">
                          <div className="text-2xl font-bold text-purple-600">{selectedStaff.totalClients}</div>
                          <div className="text-xs text-purple-600">Total Clients</div>
                        </div>
                        <div className="bg-pink-50 p-3 rounded-xl text-center">
                          <div className="text-2xl font-bold text-pink-600">{selectedStaff.rating.toFixed(1)}</div>
                          <div className="text-xs text-pink-600">Avg Rating</div>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-xl text-center">
                          <div className="text-2xl font-bold text-blue-600">{selectedStaff.appointments}</div>
                          <div className="text-xs text-blue-600">This Week</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-xl text-center">
                          <div className="text-2xl font-bold text-green-600">{selectedStaff.hoursWorked}</div>
                          <div className="text-xs text-green-600">Hours Worked</div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Additional Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Specialty:</span>
                          <span className="font-medium">{selectedStaff.specialty}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Join Date:</span>
                          <span className="font-medium">{new Date(selectedStaff.joinDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          setIsDetailsOpen(false);
                          openEditStaff(selectedStaff);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        View Schedule
                      </Button>
                    </div>
                  </div>
                )}
              </SheetContent>
            </Sheet>

            {/* Appointment Details Dialog */}
            <Dialog open={isAppointmentDetailsOpen} onOpenChange={setIsAppointmentDetailsOpen}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Appointment Details</DialogTitle>
                  <DialogDescription>
                    Complete information about this appointment
                  </DialogDescription>
                </DialogHeader>
                {selectedAppointment && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Booking ID</Label>
                        <p className="text-gray-900 font-mono">{selectedAppointment.id}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Status</Label>
                        <Badge className={getStatusColor(selectedAppointment.status)}>
                          {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700">Customer Information</Label>
                      <div className="mt-2 space-y-2">
                        <p className="font-medium">{selectedAppointment.customer.name}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          {selectedAppointment.customer.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          {selectedAppointment.customer.phone}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Service</Label>
                        <p className="text-gray-900">{selectedAppointment.service.name}</p>
                        <p className="text-sm text-gray-600">${selectedAppointment.service.price} • {selectedAppointment.service.duration} min</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Assigned Staff</Label>
                        {selectedAppointment.assignedStaff ? (
                          <p className="text-gray-900">{selectedAppointment.assignedStaff.name}</p>
                        ) : (
                          <Badge variant="outline" className="border-red-200 text-red-700">
                            Unassigned
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Date</Label>
                        <p className="text-gray-900">{format(new Date(selectedAppointment.date), 'MMMM d, yyyy')}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Time</Label>
                        <p className="text-gray-900">{selectedAppointment.time}</p>
                      </div>
                    </div>

                    {selectedAppointment.notes && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Notes</Label>
                        <p className="text-gray-600 mt-1">{selectedAppointment.notes}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Booked Via</Label>
                        <p className="text-gray-600">{selectedAppointment.bookedBy}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Created</Label>
                        <p className="text-gray-600">{format(new Date(selectedAppointment.createdAt), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAppointmentDetailsOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Assign Staff Dialog */}
            <Dialog open={isAssignStaffOpen} onOpenChange={setIsAssignStaffOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Assign Staff Member</DialogTitle>
                  <DialogDescription>
                    Select a staff member to assign to this appointment
                  </DialogDescription>
                </DialogHeader>
                {selectedAppointment && (
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="font-medium">{selectedAppointment.customer.name}</p>
                      <p className="text-sm text-gray-600">{selectedAppointment.service.name}</p>
                      <p className="text-sm text-gray-600">{format(new Date(selectedAppointment.date), 'MMM d, yyyy')} at {selectedAppointment.time}</p>
                    </div>

                    <div className="space-y-3">
                      <Label>Available Staff Members</Label>
                      <div className="space-y-2">
                        {staffMembers.filter(s => s.status === 'active').map(staff => (
                          <Button
                            key={staff.id}
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => assignStaffToAppointment(selectedAppointment.id, staff.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-bold">
                                  {staff.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <div className="text-left">
                                <div className="font-medium">{staff.name}</div>
                                <div className="text-sm text-gray-500">{staff.role}</div>
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAssignStaffOpen(false)}>
                    Cancel
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit/Reschedule Appointment Dialog */}
            <Dialog open={isEditAppointmentOpen} onOpenChange={setIsEditAppointmentOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Reschedule Appointment</DialogTitle>
                  <DialogDescription>
                    Update the date and time for this appointment
                  </DialogDescription>
                </DialogHeader>
                {selectedAppointment && (
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="font-medium">{selectedAppointment.customer.name}</p>
                      <p className="text-sm text-gray-600">{selectedAppointment.service.name}</p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label>New Date</Label>
                        <Input 
                          type="date" 
                          defaultValue={selectedAppointment.date}
                          className="border-purple-200 focus:border-purple-400 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label>New Time</Label>
                        <Input 
                          type="time" 
                          defaultValue={selectedAppointment.time}
                          className="border-purple-200 focus:border-purple-400 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                )}
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setIsEditAppointmentOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      // In a real app, get values from form
                      const newDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');
                      const newTime = '10:00';
                      rescheduleAppointment(selectedAppointment?.id, newDate, newTime);
                    }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    Reschedule
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}