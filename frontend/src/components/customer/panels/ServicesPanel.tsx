import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Slider } from '../../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Search, Clock } from 'lucide-react';
import { servicesAPI, staffAPI, API_ORIGIN } from '../../../services/api';

interface ServicesPanelProps {
  setCurrentView: (view: string) => void;
  setPreselectedServiceId: (id: string | null) => void;
}

export function ServicesPanel({
  setCurrentView,
  setPreselectedServiceId
}: ServicesPanelProps) {
  const [services, setServices] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 300]);

  const loadServices = async () => {
    try {
      const [servicesData, staffData] = await Promise.all([
        servicesAPI.getAll({ bookable: true }),
        staffAPI.getAll()
      ]);
      setServices(servicesData.map((s: any) => ({
        ...s,
        image: s.image_url && (s.image_url.startsWith('http') || s.image_url.startsWith('data:'))
          ? s.image_url  // Already absolute URL or base64
          : (s.image_url ? `${API_ORIGIN}${s.image_url}` : `https://picsum.photos/seed/${(s.name || 'salon').replace(/\s+/g, '')}/400/300`),
        staff: s.assigned_staff?.length > 0
          ? s.assigned_staff
          : staffData.filter((st: any) => st.status === 'active' || st.is_available).map((st: any) => st.name)
      })));
      setStaffMembers(staffData.filter((s: any) => s.status === 'active' || s.is_available));
    } catch (err) {
      console.error('Failed to load services or staff:', err);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  return (
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
}
