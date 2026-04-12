import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Calendar } from "./ui/calendar";
import { Badge } from "./ui/badge";
import { ArrowLeft, ArrowRight, Check, Clock, User, Scissors, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { api } from "../services/api";
import { toast } from "sonner";

interface BookingPageProps {
  setCurrentView: (view: string) => void;
}

export function BookingPage({ setCurrentView }: BookingPageProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real data from API
  const [services, setServices] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  const steps = [
    { number: 1, title: 'Select Service', icon: Scissors },
    { number: 2, title: 'Choose Date & Time', icon: Clock },
    { number: 3, title: 'Select Staff', icon: User },
    { number: 4, title: 'Confirm Booking', icon: Check }
  ];

  // Load services from backend on mount
  useEffect(() => {
    const loadServices = async () => {
      try {
        const data = await api.services.getAll();
        setServices(data);
      } catch (error) {
        toast.error('Failed to load services. Please try again.');
        console.error(error);
      } finally {
        setLoadingServices(false);
      }
    };
    loadServices();
  }, []);

  // Load staff when step 3 is reached
  useEffect(() => {
    if (!selectedService || currentStep !== 3) return;
    const loadStaff = async () => {
      setLoadingStaff(true);
      try {
        const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        const data = await api.staff.getAvailable(dateStr, parseInt(selectedService));
        setStaffList([...data, { id: 0, name: 'Any Available Staff', specialty: 'All Services' }]);
      } catch {
        try {
          const allStaff = await api.staff.getAll();
          setStaffList([...allStaff, { id: 0, name: 'Any Available Staff', specialty: 'All Services' }]);
        } catch {
          setStaffList([{ id: 0, name: 'Any Available Staff', specialty: 'All Services' }]);
        }
      } finally {
        setLoadingStaff(false);
      }
    };
    loadStaff();
  }, [selectedService, currentStep, selectedDate]);

  const handleNext = async () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      const currentUser = api.auth.getCurrentUser();
      if (!currentUser) {
        toast.error('Please log in to book an appointment');
        setCurrentView('login');
        return;
      }
      const selectedServiceData = services.find(s => s.id.toString() === selectedService);
      if (!selectedServiceData || !selectedDate) {
        toast.error('Please complete all booking steps');
        return;
      }
      setIsSubmitting(true);
      try {
        await api.appointments.create({
          service_id: selectedServiceData.id,
          staff_id: parseInt(selectedStaff) || 0,
          appointment_date: format(selectedDate, 'yyyy-MM-dd'),
          appointment_time: selectedTime,
          notes: ''
        });
        toast.success('Booking confirmed! Your appointment has been scheduled.');
        setCurrentView('customer-dashboard');
      } catch (error: any) {
        toast.error(error.message || 'Failed to create appointment. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
    else setCurrentView('home');
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedService !== '';
      case 2: return !!(selectedDate && selectedTime !== '');
      case 3: return selectedStaff !== '';
      case 4: return true;
      default: return false;
    }
  };

  const selectedServiceData = services.find(s => s.id.toString() === selectedService);
  const selectedStaffData = staffList.find(s => s.id.toString() === selectedStaff);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white py-6 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 sm:mb-4">
            Book Your Appointment
          </h1>
          <p className="text-base sm:text-lg text-gray-600">Follow these simple steps to schedule your visit</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8 sm:mb-12">
          <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto pb-4 max-w-full">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              return (
                <div key={step.number} className="flex items-center flex-shrink-0">
                  <div className={`flex items-center space-x-2 sm:space-x-3 ${index < steps.length - 1 ? 'pr-2 sm:pr-4' : ''}`}>
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted ? 'bg-green-500 text-white' : isActive ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {isCompleted ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </div>
                    <div className="hidden sm:block">
                      <p className={`text-sm font-medium ${isActive ? 'text-purple-600' : 'text-gray-600'}`}>{step.title}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-6 sm:w-8 h-0.5 mx-1 sm:mx-2 ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl mb-6 sm:mb-8">
          <CardHeader className="text-center pb-4 sm:pb-6">
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
              {steps[currentStep - 1].title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 lg:p-8">

            {/* Step 1: Select Service */}
            {currentStep === 1 && (
              loadingServices ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                  <span className="ml-3 text-gray-500">Loading services...</span>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => setSelectedService(service.id.toString())}
                      className={`p-4 sm:p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                        selectedService === service.id.toString()
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-base sm:text-lg text-gray-900">{service.name}</h3>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs sm:text-sm">
                          ${service.price}
                        </Badge>
                      </div>
                      {service.description && (
                        <p className="text-sm text-gray-500 mb-2">{service.description}</p>
                      )}
                      <p className="text-sm sm:text-base text-gray-600 flex items-center">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                        {service.duration} min
                      </p>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Step 2: Choose Date & Time */}
            {currentStep === 2 && (
              <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
                <div className="flex flex-col">
                  <h3 className="font-bold text-base sm:text-lg mb-4">Select Date</h3>
                  <div className="flex justify-center lg:justify-start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-2xl border border-purple-200"
                      disabled={(date) => date < new Date()}
                    />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg mb-4">Available Times</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 max-h-96 overflow-y-auto">
                    {timeSlots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(time)}
                        className={`rounded-xl text-sm ${
                          selectedTime === time
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0'
                            : 'border-purple-200 text-purple-600 hover:bg-purple-50'
                        }`}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Select Staff */}
            {currentStep === 3 && (
              loadingStaff ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                  <span className="ml-3 text-gray-500">Loading available staff...</span>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                  {staffList.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => setSelectedStaff(member.id.toString())}
                      className={`p-4 sm:p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                        selectedStaff === member.id.toString()
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-2">{member.name}</h3>
                      <p className="text-sm sm:text-base text-gray-600">{member.specialty}</p>
                      {member.rating && (
                        <p className="text-sm text-yellow-600 mt-1">⭐ {member.rating}</p>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Step 4: Confirm Booking */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 sm:p-6">
                  <h3 className="font-bold text-base sm:text-lg mb-4">Booking Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="text-gray-600">Service:</span>
                      <span className="font-medium text-right">{selectedServiceData?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">{selectedDate?.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="text-gray-600">Staff:</span>
                      <span className="font-medium text-right">{selectedStaffData?.name}</span>
                    </div>
                    <div className="border-t border-purple-200 pt-3">
                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="font-bold">Total:</span>
                        <span className="font-bold text-purple-600">${selectedServiceData?.price}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isSubmitting}
            className="border-2 border-gray-300 text-gray-600 hover:bg-gray-50 rounded-xl px-4 sm:px-6 py-3 w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStep === 1 ? 'Back to Home' : 'Previous'}
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 rounded-xl px-4 sm:px-6 py-3 disabled:opacity-50 w-full sm:w-auto"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Booking...</>
            ) : currentStep === 4 ? 'Confirm Booking' : (
              <>Next <ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}