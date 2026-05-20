export interface Appointment {
  id: string;
  service: {
    id: string | number;
    name: string;
    price: number;
    duration: number;
  };
  date: string;
  time: string;
  staff: {
    id: string | number;
    name: string;
    speciality?: string;
  };
  status: string;
  bookingId?: string;
  createdAt?: string;
  notes?: string;
  rating?: number;
  review?: string;
}
