import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { ImageWithFallback } from './figma/ImageWithFallback';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Scissors,
  Grid,
  List,
  DollarSign,
  Clock,
  Star,
  BarChart3,
  Upload,
  Image as ImageIcon,
  Tag,
  TrendingUp,
  Users,
  Activity,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  Palette,
  Folder
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { toast } from 'sonner';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { servicesAPI, analyticsAPI, API_ORIGIN } from '../services/api';

interface ServiceCategory {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  service_count?: number;
}

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  image_url?: string;
  category: ServiceCategory;
  is_active: boolean;
  is_available: boolean;
  booking_count: number;
  average_rating: number;
  created_at: string;
  updated_at: string;
}

interface ServiceStats {
  overview: {
    total_services: number;
    active_services: number;
    inactive_services: number;
  };
  popular_services: Array<{
    id: number;
    name: string;
    booking_count: number;
    price: number;
  }>;
  revenue_services: Array<{
    id: number;
    name: string;
    total_revenue: number;
  }>;
  category_stats: Array<{
    name: string;
    color: string;
    service_count: number;
    total_bookings: number;
  }>;
}

interface ManageServicePanelProps {
  defaultTab?: string;
}

export function ManageServicePanel({ defaultTab }: ManageServicePanelProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || 'services');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showInactiveServices, setShowInactiveServices] = useState(false);

  // Data states
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [stats, setStats] = useState<ServiceStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Dialog states
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditingService, setIsEditingService] = useState<Service | null>(null);
  const [isEditingCategory, setIsEditingCategory] = useState<ServiceCategory | null>(null);
  const [serviceDetails, setServiceDetails] = useState<any>(null);

  // Form states
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    duration: 60,
    price: 0,
    image_url: '',
    category_id: 0,
    is_active: true,
    is_available: true
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: 'folder',
    color: '#8B5CF6'
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const getFullImageUrl = (path?: string) => {
    if (!path) return '';
    if (path.startsWith('data:') || path.startsWith('http')) return path;
    return `${API_ORIGIN}${path}`;
  };

  // Data fetched from API
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const fetchedCategories = await servicesAPI.getCategories();
      setCategories(fetchedCategories);
      await loadServices(fetchedCategories);
    } catch (err) {
      toast.error('Failed to load categories');
    }
  };

  const loadServices = async (currentCategories?: ServiceCategory[]) => {
    setIsLoading(true);
    const cats = currentCategories || categories;
    const defaultCategory: ServiceCategory = { id: 0, name: 'Other', description: 'General service', icon: 'scissors', color: '#9CA3AF', service_count: 0 };

    // Helper to get consistent category name
    const getCatName = (s: any) => s.category?.name || s.category || 'Other';

    try {
      const data = await servicesAPI.getAll({ includeInactive: true });
      const mappedServices: Service[] = data.map((s: any) => {
        // Find matching category object
        const catMatch = cats.find(c => c.name.toLowerCase() === (s.category || '').toLowerCase());

        return {
          id: s.id,
          name: s.name,
          description: s.description || '',
          duration: s.duration,
          price: s.price,
          image_url: s.image_url || '',
          category: catMatch || { ...defaultCategory, name: s.category || 'Other' },
          is_active: Boolean(s.is_active),
          is_available: Boolean(s.is_active),
          booking_count: parseInt(s.booking_count) || 0,
          average_rating: parseFloat(s.average_rating) || 0,
          created_at: s.created_at || new Date().toISOString(),
          updated_at: s.updated_at || new Date().toISOString()
        };
      });

      setServices(mappedServices);

      // Fetch performance data for revenue metrics
      try {
        const perf = await analyticsAPI.getServicePerformance();

        setStats({
          overview: {
            total_services: mappedServices.length,
            active_services: mappedServices.filter(s => s.is_active).length,
            inactive_services: mappedServices.filter(s => !s.is_active).length
          },
          // Real popular services based on booking count
          popular_services: [...mappedServices]
            .sort((a, b) => b.booking_count - a.booking_count)
            .slice(0, 5)
            .map(s => ({
              id: s.id,
              name: s.name,
              booking_count: s.booking_count,
              price: s.price
            })),
          revenue_services: perf
            .map((p: any) => ({
              id: p.service_id,
              name: p.service_name,
              total_revenue: p.total_revenue || 0
            }))
            .sort((a: any, b: any) => b.total_revenue - a.total_revenue)
            .slice(0, 5),
          category_stats: [
            ...cats.map(c => ({
              name: c.name,
              color: c.color,
              service_count: mappedServices.filter(s => s.category?.name === c.name).length,
              total_bookings: mappedServices.filter(s => s.category?.name === c.name).reduce((sum, s) => sum + s.booking_count, 0)
            })),
            // Add any services that have a category NOT in the 'cats' list
            ...Array.from(new Set(mappedServices
              .filter(s => !cats.find(c => c.name === s.category?.name))
              .map(s => s.category?.name || 'Other')))
              .map(name => ({
                name,
                color: '#9CA3AF',
                service_count: mappedServices.filter(s => (s.category?.name || 'Other') === name).length,
                total_bookings: mappedServices.filter(s => (s.category?.name || 'Other') === name).reduce((sum, s) => sum + s.booking_count, 0)
              }))
          ]
        });
      } catch (e) {
        console.error('Performance data fetch failed:', e);
        // Fallback using just the services data
        setStats({
          overview: {
            total_services: mappedServices.length,
            active_services: mappedServices.filter(s => s.is_active).length,
            inactive_services: mappedServices.filter(s => !s.is_active).length
          },
          popular_services: [...mappedServices]
            .sort((a, b) => b.booking_count - a.booking_count)
            .slice(0, 5)
            .map(s => ({
              id: s.id,
              name: s.name,
              booking_count: s.booking_count,
              price: s.price
            })),
          revenue_services: [],
          category_stats: [
            ...cats.map(c => ({
              name: c.name,
              color: c.color,
              service_count: mappedServices.filter(s => s.category?.name === c.name).length,
              total_bookings: mappedServices.filter(s => s.category?.name === c.name).reduce((sum, s) => sum + s.booking_count, 0)
            })),
            ...Array.from(new Set(mappedServices
              .filter(s => !cats.find(c => c.name === s.category?.name))
              .map(s => s.category?.name || 'Other')))
              .map(name => ({
                name,
                color: '#9CA3AF',
                service_count: mappedServices.filter(s => (s.category?.name || 'Other') === name).length,
                total_bookings: mappedServices.filter(s => (s.category?.name || 'Other') === name).reduce((sum, s) => sum + s.booking_count, 0)
              }))
          ]
        });
      }
    } catch (error) {
      toast.error('Failed to load services');
    } finally {
      setIsLoading(false);
    }
  };

  // Add polling for real-time analytics sync
  useEffect(() => {
    if (activeTab === 'analytics') {
      const interval = setInterval(() => {
        loadServices();
      }, 30000); // 30s polling for analytics
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Utility functions
  const resetServiceForm = () => {
    setServiceForm({
      name: '',
      description: '',
      duration: 60,
      price: 0,
      image_url: '',
      category_id: 0,
      is_active: true,
      is_available: true
    });
    setSelectedImage(null);
    setImagePreview('');
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      icon: 'folder',
      color: '#8B5CF6'
    });
  };

  // Service management functions
  const handleAddService = async () => {
    if (!serviceForm.name || !serviceForm.category_id || serviceForm.price <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const category = categories.find(c => c.id === serviceForm.category_id);
      if (!category) {
        setIsLoading(false);
        toast.error('Invalid category selected');
        return;
      }

      await servicesAPI.create({
        name: serviceForm.name,
        description: serviceForm.description,
        duration: serviceForm.duration,
        price: serviceForm.price,
        category: category.name,
        image_url: serviceForm.image_url,
      });

      await loadServices();
      resetServiceForm();
      setIsServiceDialogOpen(false);
      toast.success(`${serviceForm.name} has been added successfully!`);
    } catch (error) {
      toast.error('Failed to add service');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditService = async () => {
    if (!isEditingService || !serviceForm.name || !serviceForm.category_id || serviceForm.price <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const category = categories.find(c => c.id === serviceForm.category_id);
      if (!category) {
        setIsLoading(false);
        toast.error('Invalid category selected');
        return;
      }

      await servicesAPI.update(isEditingService.id, {
        name: serviceForm.name,
        description: serviceForm.description,
        duration: serviceForm.duration,
        price: serviceForm.price,
        category: category.name,
        is_active: serviceForm.is_active,
        image_url: serviceForm.image_url,
      });

      await loadServices();
      resetServiceForm();
      setIsEditingService(null);
      setIsServiceDialogOpen(false);
      toast.success('Service updated successfully!');
    } catch (error) {
      toast.error('Failed to update service');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    try {
      const response: any = await servicesAPI.delete(serviceId);

      // Update local state immediately for better UX
      setServices(prev => prev.filter(s => s.id !== serviceId));

      // Re-fetch to ensure sync with backend (e.g. if it was only deactivated)
      await loadServices();

      const message = response?.message || `${service.name} has been processed successfully`;
      toast.success(message);
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error?.message || 'Failed to delete service');
      // Re-fetch on error to ensure UI matches reality
      await loadServices();
    }
  };

  const toggleServiceAvailability = async (serviceId: string) => {
    try {
      const service = services.find(s => s.id === serviceId);
      if (!service) return;

      // Must use FormData because the PUT route uses multer (multipart/form-data)
      const formData = new FormData();
      formData.append('name', service.name);
      formData.append('description', service.description || '');
      formData.append('duration', service.duration.toString());
      formData.append('price', service.price.toString());
      formData.append('category', service.category.name);
      formData.append('is_active', service.is_active ? 'false' : 'true');

      await servicesAPI.update(serviceId, formData);

      await loadServices();
      toast.success(`${service.name} ${!service.is_active ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      toast.error('Failed to update service availability');
    }
  };

  const openEditService = (service: Service) => {
    setIsEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price,
      image_url: service.image_url || '',
      category_id: service.category.id,
      is_active: service.is_active,
      is_available: service.is_available
    });
    setImagePreview(getFullImageUrl(service.image_url));
    setIsServiceDialogOpen(true);
  };

  const openViewDetails = async (serviceId: string) => {
    setIsLoading(true);
    try {
      const details = await servicesAPI.getDetails(serviceId);
      setServiceDetails(details);
      setIsDetailsDialogOpen(true);
    } catch (error) {
      toast.error('Failed to load service details');
    } finally {
      setIsLoading(false);
    }
  };

  // Category management functions (Read-only for now due to database CHECK constraints)
  const handleAddCategory = async () => {
    toast.info('Category management is restricted to predefined database categories for stability.');
    setIsCategoryDialogOpen(false);
  };

  const handleEditCategory = async () => {
    toast.info('Category management is restricted to predefined database categories for stability.');
    setIsCategoryDialogOpen(false);
    setIsEditingCategory(null);
  };

  const openEditCategory = (category: ServiceCategory) => {
    setIsEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color
    });
    setIsCategoryDialogOpen(true);
  };

  // Filter functions
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || service.category.id === parseInt(selectedCategory);

    const matchesPrice = service.price >= priceRange[0] && service.price <= priceRange[1];

    const matchesStatus = showInactiveServices || service.is_active;

    return matchesSearch && matchesCategory && matchesPrice && matchesStatus;
  }).sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'price':
        aValue = a.price;
        bValue = b.price;
        break;
      case 'duration':
        aValue = a.duration;
        bValue = b.duration;
        break;
      case 'booking_count':
        aValue = a.booking_count;
        bValue = b.booking_count;
        break;
      case 'rating':
        aValue = a.average_rating;
        bValue = b.average_rating;
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }

    if (sortOrder === 'desc') {
      return aValue < bValue ? 1 : -1;
    }
    return aValue > bValue ? 1 : -1;
  });

  const ServiceCard = ({ service }: { service: Service }) => (
    <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className="relative">
        <div className="h-48 bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
          {service.image_url ? (
            <ImageWithFallback
              src={getFullImageUrl(service.image_url)}
              alt={service.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="w-16 h-16 text-gray-400" />
          )}
        </div>

        <div className="absolute top-3 right-3 flex gap-2">
          <Badge className={service.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
            {service.is_active ? 'Active' : 'Inactive'}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
            onClick={() => toggleServiceAvailability(service.id)}
          >
            {service.is_available ?
              <ToggleRight className="h-4 w-4 text-green-600" /> :
              <ToggleLeft className="h-4 w-4 text-red-600" />
            }
          </Button>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-1">{service.name}</h3>
            <p className="text-gray-600 text-sm line-clamp-2 mb-2">{service.description}</p>
            <Badge
              variant="outline"
              className="text-xs"
              style={{
                borderColor: service.category.color,
                color: service.category.color
              }}
            >
              {service.category.name}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{service.duration}min</span>
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span>${service.price}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span>{service.average_rating}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{service.booking_count} bookings</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-purple-200 text-purple-600 hover:bg-purple-50"
            onClick={() => openViewDetails(service.id)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-purple-200 text-purple-600 hover:bg-purple-50"
            onClick={() => openEditService(service)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Service</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {service.name}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDeleteService(service.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete Service
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">


      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-col sm:grid sm:grid-cols-3 w-full h-auto gap-1 bg-purple-50 border border-purple-100 rounded-xl p-1">
          <TabsTrigger value="services" className="flex w-full items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-purple-600">
            <Scissors className="w-4 h-4" />
            Services
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex w-full items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-purple-600">
            <Tag className="w-4 h-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex w-full items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-purple-600">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Services ({filteredServices.length})</h2>
              <p className="text-gray-600">Manage your salon services and pricing</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-white rounded-lg border border-purple-200 p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{isEditingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
                    <DialogDescription>
                      {isEditingService ? 'Update the service details below.' : 'Enter the details for the new service below.'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="service-name">Service Name *</Label>
                        <Input
                          id="service-name"
                          placeholder="Enter service name"
                          value={serviceForm.name}
                          onChange={(e) => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="service-category">Category *</Label>
                        <Select value={serviceForm.category_id.toString()} onValueChange={(value) => setServiceForm(prev => ({ ...prev, category_id: parseInt(value) }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="service-description">Description</Label>
                      <Textarea
                        id="service-description"
                        placeholder="Enter service description"
                        value={serviceForm.description}
                        onChange={(e) => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="service-duration">Duration (minutes) *</Label>
                        <Input
                          id="service-duration"
                          type="number"
                          placeholder="60"
                          value={serviceForm.duration}
                          onChange={(e) => setServiceForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="service-price">Price ($) *</Label>
                        <Input
                          id="service-price"
                          type="number"
                          placeholder="85"
                          value={serviceForm.price}
                          onChange={(e) => setServiceForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Image URL</Label>
                      <Input
                        placeholder="https://example.com/image.jpg"
                        value={serviceForm.image_url}
                        onChange={(e) => {
                          setServiceForm(prev => ({ ...prev, image_url: e.target.value }));
                          setImagePreview(e.target.value);
                        }}
                      />
                      {imagePreview && (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-40 object-cover rounded-xl mt-2"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="service-active"
                          checked={serviceForm.is_active}
                          onCheckedChange={(checked) => setServiceForm(prev => ({ ...prev, is_active: checked }))}
                        />
                        <Label htmlFor="service-active">Active Service</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="service-available"
                          checked={serviceForm.is_available}
                          onCheckedChange={(checked) => setServiceForm(prev => ({ ...prev, is_available: checked }))}
                        />
                        <Label htmlFor="service-available">Available for Booking</Label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => {
                      setIsServiceDialogOpen(false);
                      setIsEditingService(null);
                      resetServiceForm();
                    }}>
                      Cancel
                    </Button>
                    <Button
                      onClick={isEditingService ? handleEditService : handleAddService}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : (isEditingService ? 'Update Service' : 'Add Service')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Search and Filters */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search services by name, description, or category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-purple-200 focus:border-purple-400 rounded-xl"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full lg:w-48 border-purple-200 focus:border-purple-400 rounded-xl">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full lg:w-48 border-purple-200 focus:border-purple-400 rounded-xl">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="duration">Duration</SelectItem>
                      <SelectItem value="booking_count">Popularity</SelectItem>
                      <SelectItem value="rating">Rating</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="border-purple-200 text-purple-600 hover:bg-purple-50"
                  >
                    {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                  <div className="flex-1">
                    <Label className="text-sm mb-2 block">Price Range: ${priceRange[0]} - ${priceRange[1]}</Label>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={500}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-inactive"
                      checked={showInactiveServices}
                      onCheckedChange={setShowInactiveServices}
                    />
                    <Label htmlFor="show-inactive" className="text-sm">Show inactive services</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services Grid/List */}
          <div className={viewMode === 'list' ? "hidden md:block" : "block"}>
            {viewMode === 'grid' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredServices.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
                {filteredServices.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Scissors className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg">No services found</p>
                    <p className="text-sm">Try adjusting your search criteria</p>
                  </div>
                )}
              </>
            ) : (
              <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Bookings</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredServices.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
                                {service.image_url ? (
                                  <ImageWithFallback
                                    src={getFullImageUrl(service.image_url)}
                                    alt={service.name}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <ImageIcon className="w-6 h-6 text-gray-400" />
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{service.name}</div>
                                <div className="text-sm text-gray-500 line-clamp-1">{service.description}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              style={{
                                borderColor: service.category.color,
                                color: service.category.color
                              }}
                            >
                              {service.category.name}
                            </Badge>
                          </TableCell>
                          <TableCell>{service.duration} min</TableCell>
                          <TableCell>${service.price}</TableCell>
                          <TableCell>{service.booking_count}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span>{service.average_rating}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Badge className={service.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                {service.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => toggleServiceAvailability(service.id)}
                              >
                                {service.is_available ?
                                  <ToggleRight className="h-4 w-4 text-green-600" /> :
                                  <ToggleLeft className="h-4 w-4 text-red-600" />
                                }
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-purple-600 hover:bg-purple-50"
                                onClick={() => openViewDetails(service.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-purple-600 hover:bg-purple-50"
                                onClick={() => openEditService(service)}
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
                                    <AlertDialogTitle>Delete Service</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete {service.name}? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteService(service.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete Service
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
                  {filteredServices.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Scissors className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-lg">No services found</p>
                      <p className="text-sm">Try adjusting your search criteria</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {viewMode === 'list' && (
            <div className="md:hidden">
              {filteredServices.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Scissors className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg">No services found</p>
                  <p className="text-sm">Try adjusting your search criteria</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredServices.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              )}
            </div>
          )}
          {viewMode === 'grid' && (
            <div className="md:hidden">
              {filteredServices.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Scissors className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg">No services found</p>
                  <p className="text-sm">Try adjusting your search criteria</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {filteredServices.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Service Categories</h2>
              <p className="text-gray-600">Organize your services into categories</p>
            </div>
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{isEditingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                  <DialogDescription>
                    {isEditingCategory ? 'Update the category details below.' : 'Create a new service category.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category-name">Category Name *</Label>
                    <Input
                      id="category-name"
                      placeholder="Enter category name"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category-description">Description</Label>
                    <Textarea
                      id="category-description"
                      placeholder="Enter category description"
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category-icon">Icon</Label>
                      <Select value={categoryForm.icon} onValueChange={(value) => setCategoryForm(prev => ({ ...prev, icon: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select icon" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scissors">✂️ Scissors</SelectItem>
                          <SelectItem value="star">⭐ Star</SelectItem>
                          <SelectItem value="palette">🎨 Palette</SelectItem>
                          <SelectItem value="activity">💆 Activity</SelectItem>
                          <SelectItem value="folder">📁 Folder</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category-color">Color</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="category-color"
                          type="color"
                          value={categoryForm.color}
                          onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                          className="w-16 h-10 rounded-lg border-purple-200"
                        />
                        <Input
                          value={categoryForm.color}
                          onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                          placeholder="#8B5CF6"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => {
                    setIsCategoryDialogOpen(false);
                    setIsEditingCategory(null);
                    resetCategoryForm();
                  }}>
                    Cancel
                  </Button>
                  <Button
                    onClick={isEditingCategory ? handleEditCategory : handleAddCategory}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {isEditingCategory ? 'Update Category' : 'Add Category'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Card key={category.id} className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.icon === 'scissors' && '✂️'}
                      {category.icon === 'star' && '⭐'}
                      {category.icon === 'palette' && '🎨'}
                      {category.icon === 'activity' && '💆'}
                      {category.icon === 'folder' && '📁'}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Filter className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditCategory(category)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Category
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Category
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h3 className="font-semibold text-lg text-gray-900 mb-2">{category.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{category.description}</p>

                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: category.color,
                        color: category.color
                      }}
                    >
                      {category.service_count || 0} services
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-purple-600 hover:bg-purple-50"
                      onClick={() => {
                        setSelectedCategory(category.id.toString());
                        setActiveTab('services');
                      }}
                    >
                      View Services
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Service Analytics</h2>
            <p className="text-gray-600">Track performance and insights for your services</p>
          </div>

          {stats && (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 text-sm font-medium">Total Services</p>
                        <p className="text-3xl font-bold text-blue-900">{stats.overview.total_services}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                        <Scissors className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100 rounded-3xl shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 text-sm font-medium">Active Services</p>
                        <p className="text-3xl font-bold text-green-900">{stats.overview.active_services}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                        <Activity className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-600 text-sm font-medium">Inactive Services</p>
                        <p className="text-3xl font-bold text-orange-900">{stats.overview.inactive_services}</p>
                      </div>
                      <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                        <ToggleLeft className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Popular Services */}
                <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      Most Popular Services
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={stats.popular_services}>
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          fontSize={12}
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="booking_count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Category Distribution */}
                <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Folder className="w-5 h-5 text-purple-600" />
                      Services by Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={stats.category_stats}
                          cx="50%"
                          cy="45%"
                          labelLine={true}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="service_count"
                          label={({ name, value, percent }) => {
                            if (value === 0 || percent < 0.05) return null;
                            return `${name}: ${value}`;
                          }}
                        >
                          {stats.category_stats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(value, entry: any) => (
                            <span className="text-gray-700 text-sm">
                              {value} ({entry.payload.service_count})
                            </span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Analytics */}
              <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                    Top Revenue Generating Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.revenue_services.map((service, index) => (
                      <div key={service.id} className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">
                            <span className="text-purple-600 text-sm font-bold">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{service.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-purple-600">${service.total_revenue.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">Total Revenue</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Service Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Service Details: {serviceDetails?.service?.name || 'Loading...'}</DialogTitle>
          </DialogHeader>

          {serviceDetails && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Category:</span> {serviceDetails.service.category}</p>
                    <p><span className="text-gray-500">Price:</span> ${serviceDetails.service.price}</p>
                    <p><span className="text-gray-500">Duration:</span> {serviceDetails.service.duration} minutes</p>
                    <p><span className="text-gray-500">Description:</span> {serviceDetails.service.description || 'No description'}</p>
                  </div>
                </div>
                <div className="h-40 bg-gray-100 rounded-xl overflow-hidden">
                  {serviceDetails.service.image_url ? (
                    <img src={getFullImageUrl(serviceDetails.service.image_url)} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  Assigned Staff ({serviceDetails.assignedStaff.length})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {serviceDetails.assignedStaff.length > 0 ? (
                    serviceDetails.assignedStaff.map((staff: any) => (
                      <div key={staff.id} className="p-3 bg-purple-50 rounded-xl text-center">
                        <p className="font-medium text-purple-900">{staff.name}</p>
                        <p className="text-xs text-purple-600">{staff.specialty}</p>
                        <p className="text-xs text-yellow-600 mt-1">⭐ {staff.rating}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic col-span-full">No staff members assigned yet.</p>
                  )}
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  Recent & Upcoming Bookings
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviceDetails.bookings.length > 0 ? (
                      serviceDetails.bookings.map((booking: any) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">{booking.customer_name}</TableCell>
                          <TableCell>{booking.appointment_date}</TableCell>
                          <TableCell>{booking.appointment_time}</TableCell>
                          <TableCell>
                            <Badge className={
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                  'bg-yellow-100 text-yellow-700'
                            }>
                              {booking.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-gray-500 italic">
                          No bookings found for this service.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}