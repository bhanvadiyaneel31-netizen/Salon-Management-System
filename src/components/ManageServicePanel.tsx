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
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

interface ServiceCategory {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  service_count?: number;
}

interface Service {
  id: number;
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

export function ManageServicePanel() {
  const [activeTab, setActiveTab] = useState('services');
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
  const [isEditingService, setIsEditingService] = useState<Service | null>(null);
  const [isEditingCategory, setIsEditingCategory] = useState<ServiceCategory | null>(null);
  
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

  // Mock data - In real implementation, this would come from API calls
  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    // Mock categories
    const mockCategories: ServiceCategory[] = [
      { id: 1, name: 'Hair Services', description: 'All hair-related treatments', icon: 'scissors', color: '#8B5CF6', service_count: 4 },
      { id: 2, name: 'Facial Treatments', description: 'Skin care and facial services', icon: 'star', color: '#EC4899', service_count: 2 },
      { id: 3, name: 'Nail Care', description: 'Manicure and pedicure services', icon: 'palette', color: '#10B981', service_count: 3 },
      { id: 4, name: 'Massage Therapy', description: 'Relaxation and therapeutic massages', icon: 'activity', color: '#F59E0B', service_count: 2 }
    ];

    // Mock services
    const mockServices: Service[] = [
      {
        id: 1,
        name: 'Premium Hair Cut & Style',
        description: 'Professional haircut with styling and blow-dry',
        duration: 60,
        price: 85,
        image_url: '/api/placeholder/300/200',
        category: mockCategories[0],
        is_active: true,
        is_available: true,
        booking_count: 145,
        average_rating: 4.8,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-12-15T10:00:00Z'
      },
      {
        id: 2,
        name: 'Hair Coloring & Highlights',
        description: 'Full hair coloring service with professional color consultation',
        duration: 180,
        price: 220,
        image_url: '/api/placeholder/300/200',
        category: mockCategories[0],
        is_active: true,
        is_available: true,
        booking_count: 89,
        average_rating: 4.9,
        created_at: '2024-01-20T10:00:00Z',
        updated_at: '2024-12-10T10:00:00Z'
      },
      {
        id: 3,
        name: 'Signature Facial Treatment',
        description: 'Rejuvenating facial with deep cleansing and moisturizing',
        duration: 75,
        price: 120,
        image_url: '/api/placeholder/300/200',
        category: mockCategories[1],
        is_active: true,
        is_available: true,
        booking_count: 167,
        average_rating: 4.7,
        created_at: '2024-02-01T10:00:00Z',
        updated_at: '2024-12-12T10:00:00Z'
      },
      {
        id: 4,
        name: 'Gel Manicure',
        description: 'Long-lasting gel manicure with nail art options',
        duration: 45,
        price: 65,
        image_url: '/api/placeholder/300/200',
        category: mockCategories[2],
        is_active: true,
        is_available: true,
        booking_count: 203,
        average_rating: 4.6,
        created_at: '2024-02-10T10:00:00Z',
        updated_at: '2024-12-08T10:00:00Z'
      },
      {
        id: 5,
        name: 'Luxury Spa Pedicure',
        description: 'Relaxing pedicure with foot massage and nail care',
        duration: 60,
        price: 75,
        image_url: '/api/placeholder/300/200',
        category: mockCategories[2],
        is_active: false,
        is_available: false,
        booking_count: 78,
        average_rating: 4.5,
        created_at: '2024-02-15T10:00:00Z',
        updated_at: '2024-11-20T10:00:00Z'
      },
      {
        id: 6,
        name: 'Deep Tissue Massage',
        description: 'Therapeutic massage for muscle tension relief',
        duration: 90,
        price: 180,
        image_url: '/api/placeholder/300/200',
        category: mockCategories[3],
        is_active: true,
        is_available: true,
        booking_count: 124,
        average_rating: 4.8,
        created_at: '2024-03-01T10:00:00Z',
        updated_at: '2024-12-05T10:00:00Z'
      }
    ];

    // Mock stats
    const mockStats: ServiceStats = {
      overview: {
        total_services: 6,
        active_services: 5,
        inactive_services: 1
      },
      popular_services: [
        { id: 4, name: 'Gel Manicure', booking_count: 203, price: 65 },
        { id: 3, name: 'Signature Facial Treatment', booking_count: 167, price: 120 },
        { id: 1, name: 'Premium Hair Cut & Style', booking_count: 145, price: 85 },
        { id: 6, name: 'Deep Tissue Massage', booking_count: 124, price: 180 },
        { id: 2, name: 'Hair Coloring & Highlights', booking_count: 89, price: 220 }
      ],
      revenue_services: [
        { id: 2, name: 'Hair Coloring & Highlights', total_revenue: 19580 },
        { id: 6, name: 'Deep Tissue Massage', total_revenue: 22320 },
        { id: 3, name: 'Signature Facial Treatment', total_revenue: 20040 },
        { id: 4, name: 'Gel Manicure', total_revenue: 13195 },
        { id: 1, name: 'Premium Hair Cut & Style', total_revenue: 12325 }
      ],
      category_stats: [
        { name: 'Hair Services', color: '#8B5CF6', service_count: 2, total_bookings: 234 },
        { name: 'Facial Treatments', color: '#EC4899', service_count: 1, total_bookings: 167 },
        { name: 'Nail Care', color: '#10B981', service_count: 2, total_bookings: 281 },
        { name: 'Massage Therapy', color: '#F59E0B', service_count: 1, total_bookings: 124 }
      ]
    };

    setCategories(mockCategories);
    setServices(mockServices);
    setStats(mockStats);
  };

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

  // Image handling
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Service management functions
  const handleAddService = async () => {
    if (!serviceForm.name || !serviceForm.category_id || serviceForm.price <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // In real implementation, this would be an API call
      const category = categories.find(c => c.id === serviceForm.category_id);
      if (!category) {
        toast.error('Invalid category selected');
        return;
      }

      const newService: Service = {
        id: Math.max(...services.map(s => s.id)) + 1,
        ...serviceForm,
        category,
        booking_count: 0,
        average_rating: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        image_url: imagePreview || serviceForm.image_url
      };

      setServices(prev => [...prev, newService]);
      resetServiceForm();
      setIsServiceDialogOpen(false);
      toast.success(`${newService.name} has been added successfully!`);
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
        toast.error('Invalid category selected');
        return;
      }

      setServices(prev => 
        prev.map(service => 
          service.id === isEditingService.id 
            ? { 
                ...service, 
                ...serviceForm, 
                category,
                updated_at: new Date().toISOString(),
                image_url: imagePreview || serviceForm.image_url
              }
            : service
        )
      );
      
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

  const handleDeleteService = async (serviceId: number) => {
    const service = services.find(s => s.id === serviceId);
    try {
      setServices(prev => prev.filter(service => service.id !== serviceId));
      toast.success(`${service?.name} has been deleted`);
    } catch (error) {
      toast.error('Failed to delete service');
    }
  };

  const toggleServiceAvailability = async (serviceId: number) => {
    try {
      setServices(prev => 
        prev.map(service => 
          service.id === serviceId 
            ? { 
                ...service, 
                is_available: !service.is_available,
                updated_at: new Date().toISOString()
              }
            : service
        )
      );
      
      const service = services.find(s => s.id === serviceId);
      toast.success(`${service?.name} ${service?.is_available ? 'disabled' : 'enabled'} successfully`);
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
    setImagePreview(service.image_url || '');
    setIsServiceDialogOpen(true);
  };

  // Category management functions
  const handleAddCategory = async () => {
    if (!categoryForm.name) {
      toast.error('Category name is required');
      return;
    }

    try {
      const newCategory: ServiceCategory = {
        id: Math.max(...categories.map(c => c.id)) + 1,
        ...categoryForm,
        service_count: 0
      };

      setCategories(prev => [...prev, newCategory]);
      resetCategoryForm();
      setIsCategoryDialogOpen(false);
      toast.success(`${newCategory.name} category has been created!`);
    } catch (error) {
      toast.error('Failed to create category');
    }
  };

  const handleEditCategory = async () => {
    if (!isEditingCategory || !categoryForm.name) {
      toast.error('Category name is required');
      return;
    }

    try {
      setCategories(prev => 
        prev.map(category => 
          category.id === isEditingCategory.id 
            ? { ...category, ...categoryForm }
            : category
        )
      );
      
      resetCategoryForm();
      setIsEditingCategory(null);
      setIsCategoryDialogOpen(false);
      toast.success('Category updated successfully!');
    } catch (error) {
      toast.error('Failed to update category');
    }
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
              src={service.image_url}
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Management</h1>
          <p className="text-gray-600 mt-2">Manage your salon services, categories, and analytics</p>
        </div>
      </div>

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
                      <Label>Service Image</Label>
                      <div className="border-2 border-dashed border-purple-200 rounded-lg p-6 text-center">
                        {imagePreview ? (
                          <div className="relative">
                            <img src={imagePreview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 bg-white/90"
                              onClick={() => {
                                setImagePreview('');
                                setSelectedImage(null);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                            <p className="text-sm text-gray-500">PNG, JPG, JPEG up to 10MB</p>
                            <input
                              type="file"
                              id="service-image-upload"
                              accept="image/*"
                              onChange={handleImageSelect}
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-3"
                              onClick={() => document.getElementById('service-image-upload')?.click()}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Choose File
                            </Button>
                          </div>
                        )}
                      </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
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
                                  src={service.image_url}
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
            <div className="grid grid-cols-1 gap-6 md:hidden">
              {filteredServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
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
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="service_count"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {stats.category_stats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
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
    </div>
  );
}