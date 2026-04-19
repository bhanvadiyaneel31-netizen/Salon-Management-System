import { 
  TrendingUp, 
  Scissors, 
  Users, 
  Calendar, 
  DollarSign, 
  Home, 
  Bell, 
  Settings, 
  LogOut,
  User,
  Clock,
  CalendarPlus,
  LayoutDashboard
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface SidebarProps {
  role: string | null;
  activeSection: string;
  setActiveSection: (section: string) => void;
  unreadCounts?: {
    notifications?: number;
  };
  handleLogout: () => void;
  onNavigate?: () => void;
}

export function Sidebar({ 
  role, 
  activeSection, 
  setActiveSection, 
  unreadCounts, 
  handleLogout,
  onNavigate 
}: SidebarProps) {
  
  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
          { id: 'manage-services', label: 'Manage Services', icon: Scissors },
          { id: 'staff', label: 'Manage Staff', icon: Users },
          { id: 'appointments', label: 'Appointments', icon: Calendar },
          { id: 'reports', label: 'Reports', icon: DollarSign },
        ];
      case 'staff':
        return [
          { id: 'dashboard', label: 'Overview', icon: Home },
          { id: 'appointments', label: 'Appointments', icon: Users },
          { id: 'schedule', label: 'Schedule', icon: Calendar },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'settings', label: 'Settings', icon: Settings },
        ];
      case 'customer':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
          { id: 'services', label: 'Browse Services', icon: Scissors },
          { id: 'appointments', label: 'My Appointments', icon: Calendar },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'profile', label: 'Profile Settings', icon: User },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const getRoleTitle = () => {
    switch (role) {
      case 'admin': return 'Admin Panel';
      case 'staff': return 'Staff Portal';
      case 'customer': return 'Customer Hub';
      default: return 'Dashboard';
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'admin': return Settings;
      case 'staff': return LayoutDashboard;
      case 'customer': return User;
      default: return Home;
    }
  };

  const RoleIcon = getRoleIcon();

  return (
    <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-none lg:rounded-3xl shadow-xl h-full lg:h-auto lg:sticky lg:top-24">
      <CardHeader className="text-center pb-4 pt-8">
        <div className="flex items-center gap-3 mb-6 px-2 lg:hidden">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl flex items-center justify-center shrink-0">
            <Scissors className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent truncate">
            Bella Salon
          </span>
        </div>
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto flex items-center justify-center mb-4 shadow-lg">
          <RoleIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        </div>
        <CardTitle className="text-lg sm:text-xl font-bold text-gray-900">{getRoleTitle()}</CardTitle>
        <p className="text-xs sm:text-sm text-gray-600">Management & Overview</p>
      </CardHeader>
      
      <CardContent className="space-y-2 px-3 sm:px-4">
        {navItems.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant="ghost"
            className={`w-full justify-start rounded-xl transition-all duration-200 ${
              activeSection === id 
                ? 'text-purple-600 bg-purple-50 font-semibold shadow-sm' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-purple-500'
            }`}
            onClick={() => {
              setActiveSection(id);
              onNavigate?.();
            }}
          >
            <Icon className="w-4 h-4 mr-3" />
            <span className="truncate">{label}</span>
            {id === 'notifications' && unreadCounts?.notifications && unreadCounts.notifications > 0 ? (
              <Badge className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full">
                {unreadCounts.notifications}
              </Badge>
            ) : null}
          </Button>
        ))}
        
        <div className="pt-4 mt-2 border-t border-gray-100">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-3" />
            <span>Logout</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
