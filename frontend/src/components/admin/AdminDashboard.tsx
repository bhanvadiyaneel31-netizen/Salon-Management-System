import { useState, useEffect } from "react";
import { Badge } from "../ui/badge";
import { appointmentsAPI, staffAPI, servicesAPI } from "../../services/api";
import { toast } from "sonner";

// Import panel components
import { OverviewPanel } from "./panels/OverviewPanel";
import { StaffPanel } from "./panels/StaffPanel";
import { ManageServicesPanel } from "./panels/ManageServicesPanel";
import { AppointmentsPanel } from "./panels/AppointmentsPanel";
import { ReportsPanel } from "./panels/ReportsPanel";
import { LoyaltySettingsPanel } from "./panels/LoyaltySettingsPanel";

interface AdminDashboardProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  setCurrentView: (view: string) => void;
  setUserRole: (role: string | null) => void;
  isDark?: boolean;
  toggleDark?: () => void;
}

export function AdminDashboard({
  activeSection,
  setActiveSection,
  setCurrentView,
  setUserRole,
  isDark,
  toggleDark
}: AdminDashboardProps) {
  const [services, setServices] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const loadServices = async () => {
    try {
      const data = await servicesAPI.getAll();
      setServices(data || []);
    } catch (err) {
      console.error('Failed to load services:', err);
    }
  };

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
        role: s.role || 'staff',
        category: s.category || 'Hair',
        status: s.is_available ? 'active' : 'inactive',
        specialty: s.specialty || '',
        rating: s.rating ?? 0,
        appointments: s.completed_appointments ?? 0,
        assigned_service_ids: s.assigned_service_ids || s.services || [],
        totalClients: 0,
        hoursWorked: 0,
        joinDate: s.created_at ? s.created_at.split('T')[0] : '',
        profile_image: s.profile_image || null
      }));
      setStaffMembers(normalized);
    } catch (err) {
      console.error('Failed to load staff:', err);
      toast.error('Failed to load staff members');
    } finally {
      setLoadingStaff(false);
    }
  };

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
          id: apt.service?.id,
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
        bookedBy: 'customer',
        // Financial tracking fields
        original_amount: apt.original_amount ?? apt.price ?? 0,
        discount_amount: apt.discount_amount ?? 0,
        final_amount: apt.final_amount ?? ((apt.price ?? 0) - (apt.discount_amount ?? 0)) ?? 0,
        discount_type: apt.discount_type,
        points_redeemed: apt.points_redeemed
      }));
      setAppointments(normalized);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoadingAppointments(false);
    }
  };

  useEffect(() => {
    loadServices();
    loadStaff();
    loadAppointments();

    const interval = setInterval(() => {
      loadStaff();
      loadAppointments();
    }, 60000); // Poll every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="py-4 lg:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {activeSection === 'dashboard' ? 'Dashboard Overview' :
                activeSection === 'staff' ? 'Staff Management' :
                  activeSection === 'manage-services' ? 'Service Management' :
                    activeSection === 'appointments' ? 'Appointment Management' :
                      activeSection === 'reports' ? 'Reports & Analytics' :
                        activeSection.replace('-', ' ')}
            </h1>
            <p className="text-gray-500">Admin Portal • Manage your salon operations and staff</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-100 px-3 py-1">
              Admin Mode
            </Badge>
          </div>
        </div>

        <div className="space-y-6 lg:space-y-8">
          {activeSection === 'dashboard' && (
            <OverviewPanel staffMembers={staffMembers} setActiveSection={setActiveSection} />
          )}

          {activeSection === 'staff' && (
            <StaffPanel
              staffMembers={staffMembers}
              services={services}
              onStaffChange={loadStaff}
              setActiveSection={setActiveSection}
            />
          )}

          {activeSection === 'manage-services' && (
            <ManageServicesPanel />
          )}

          {activeSection === 'appointments' && (
            <AppointmentsPanel
              appointments={appointments}
              staffMembers={staffMembers}
              services={services}
              onAppointmentsChange={loadAppointments}
            />
          )}

          {activeSection === 'reports' && (
            <ReportsPanel
              staffMembers={staffMembers}
              appointments={appointments}
            />
          )}

          {activeSection === 'loyalty-settings' && (
            <LoyaltySettingsPanel />
          )}
        </div>
      </div>
    </div>
  );
}
