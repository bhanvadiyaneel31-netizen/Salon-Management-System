import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Calendar } from "./ui/calendar";
import { Badge } from "./ui/badge";
import { ArrowLeft, ArrowRight, Check, Clock, User, Scissors, Loader2, Star, Coins, Award } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { api } from "../services/api";
import { toast } from "sonner";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";

interface BookingPageProps {
  setCurrentView: (view: string) => void;
  initialServiceId?: string | null;
  onResetSelection?: () => void;
}

export function BookingPage({ setCurrentView, initialServiceId, onResetSelection }: BookingPageProps) {
  const [currentStep, setCurrentStep] = useState(initialServiceId ? 2 : 1);
  const [selectedService, setSelectedService] = useState<string>(initialServiceId || '');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real data from API
  const [services, setServices] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Loyalty Program State
  const [userPoints, setUserPoints] = useState(0);
  const [loyaltySettings, setLoyaltySettings] = useState<any>(null);
  const [usePoints, setUsePoints] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [selectedReward, setSelectedReward] = useState<any>(null);

  const steps = [
    { number: 1, title: 'Select Service', icon: Scissors },
    { number: 2, title: 'Select Staff', icon: User },
    { number: 3, title: 'Choose Date & Time', icon: Clock },
    { number: 4, title: 'Confirm Booking', icon: Check }
  ];

  const selectedServiceData = services.find(s => s.id.toString() === selectedService);
  const selectedStaffData = staffList.find(s => s.id.toString() === selectedStaff);

  // Load services with bookable filter
  useEffect(() => {
    const loadServices = async () => {
      setLoadingServices(true);
      try {
        const data = await api.services.getAll({ bookable: true });
        setServices(data);
      } catch (error) {
        toast.error('Failed to load services');
      } finally {
        setLoadingServices(false);
      }
    };
    loadServices();
  }, []);

  // Load staff when service is selected
  // FIX: Also depends on `services` and `loadingServices` to handle the race condition
  // where initialServiceId is set before services have finished loading from the API.
  useEffect(() => {
    if (!selectedService) {
      setStaffList([]);
      return;
    }

    // Wait until services have finished loading before attempting staff lookup
    if (loadingServices) {
      return;
    }

    const loadStaff = async () => {
      setLoadingStaff(true);
      try {
        const selectedServiceData = services.find(
          s => (s.id || s._id)?.toString() === selectedService?.toString()
        );

        console.log("Selected Service:", selectedServiceData);

        if (!selectedServiceData) {
          console.error("Service not found in loaded services list");
          setStaffList([]);
          return;
        }

        // ✅ FIX: Use api.staff.getBookable() for public endpoint
        // This works for unauthenticated users (before login)
        // The backend endpoint /api/staff/bookable doesn't require authentication
        const data = await api.staff.getBookable(selectedService);

        setStaffList(data);
      } catch (error) {
        console.error('Failed to load staff:', error);
        toast.error('Failed to load staff');
        setStaffList([]);
      } finally {
        setLoadingStaff(false);
      }
    };
    loadStaff();
  }, [selectedService, services, loadingServices]);

  // Load slots when step 3 is reached and date is selected
  useEffect(() => {
    if (currentStep !== 3 || !selectedDate || !selectedService || !selectedStaff) {
      setAvailableTimeSlots([]);
      return;
    }
    const loadSlots = async () => {
      let cancelled = false;
      setLoadingSlots(true);
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        console.log(`[FRONTEND] Loading slots for staff: ${selectedStaff}, service: ${selectedService}, date: ${dateStr}`);
        const data = await api.appointments.getAvailableSlots(dateStr, selectedStaff, selectedService);

        if (cancelled) return;

        // Additional frontend filtering for today to ensure real-time accuracy
        const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
        let filteredSlots = data;

        if (isToday) {
          const now = new Date();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          filteredSlots = data.filter(slot => {
            const [h, m] = slot.split(':').map(Number);
            const slotMinutes = h * 60 + m;
            return slotMinutes > currentMinutes + 15; // 15 min buffer
          });
        }

        if (cancelled) return;
        setAvailableTimeSlots(filteredSlots);

        // Add a timer to re-filter slots every minute if it's today
        let slotTimer: any;
        if (isToday) {
          slotTimer = setInterval(() => {
            if (cancelled) return;
            const now = new Date();
            const curMins = now.getHours() * 60 + now.getMinutes();
            setAvailableTimeSlots(prev => prev.filter(slot => {
              const [h, m] = slot.split(':').map(Number);
              return (h * 60 + m) > curMins + 15;
            }));
          }, 60000);
        }

        if (selectedTime && !filteredSlots.includes(selectedTime)) {
          setSelectedTime('');
        }

        return () => {
          cancelled = true;
          if (slotTimer) clearInterval(slotTimer);
        };
      } catch (error: any) {
        if (cancelled) return;
        // Only show error if parameters were actually valid
        console.error('Slot loading error:', error);
        toast.error(`Failed to load slots: ${error.message}`);
        setAvailableTimeSlots([]);
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    };
    const cleanupPromise = loadSlots();
    return () => {
      cleanupPromise.then(fn => fn && typeof fn === 'function' && fn());
    };
  }, [selectedDate, selectedService, selectedStaff, currentStep]);

  const [loyaltyRewards, setLoyaltyRewards] = useState<any[]>([]);

  // Load Loyalty Info
  useEffect(() => {
    const fetchLoyaltyInfo = async () => {
      try {
        const settings = await api.loyalty.getSettings();
        setLoyaltySettings(settings);

        const rewards = await api.loyalty.getRewards();
        setLoyaltyRewards(rewards);

        const points = await api.loyalty.getUserPoints();
        setUserPoints(points.available_points || 0);
      } catch (error) {
        console.log("Not logged in or loyalty system unavailable");
      }
    };
    fetchLoyaltyInfo();
  }, []);

  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!selectedService;
      case 2: return !!selectedStaff;
      case 3: return !!selectedDate && !!selectedTime;
      case 4: return true;
      default: return false;
    }
  };

  const handleNext = async () => {
    if (currentStep === 4) {
      await submitBooking();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep === 1) {
      setCurrentView('home');
      if (onResetSelection) onResetSelection();
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitBooking = async () => {
    if (!canProceed()) {
      toast.error('Please complete all booking steps');
      return;
    }

    setIsSubmitting(true);
    try {
      const appointmentData = {
        serviceId: selectedService,
        staffId: selectedStaff,
        appointmentDate: format(selectedDate!, 'yyyy-MM-dd'),
        appointmentTime: selectedTime,
        loyaltyPointsRedeemed: usePoints ? pointsToRedeem : 0,
      };

      const response = await api.appointments.create(appointmentData);

      if (response?.id) {
        toast.success('Booking confirmed! Your appointment has been scheduled.');
        setCurrentView('home');
        if (onResetSelection) onResetSelection();
      } else {
        toast.error('Failed to create appointment');
      }
    } catch (error: any) {
      console.error('Booking submission error:', error);
      const message = error?.response?.data?.message || error?.message || 'Failed to submit booking';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderLoyaltyRedemption = () => {
    if (!loyaltySettings || !userPoints) return null;

    const serviceCost = selectedServiceData?.price || 0;
    const maxRedeemablePoints = Math.floor(serviceCost * 100); // Assuming 1 point = 1 cent

    return (
      <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            <Award className="w-5 h-5 mr-2 text-amber-600" />
            Redeem Loyalty Points
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between bg-white rounded-lg p-3">
            <span className="text-sm font-medium text-gray-700">Available Points:</span>
            <span className="text-lg font-bold text-amber-600">{userPoints.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={usePoints}
              onCheckedChange={setUsePoints}
              disabled={userPoints === 0}
            />
            <Label className="text-sm cursor-pointer">Use points for this booking</Label>
          </div>

          {usePoints && userPoints > 0 && (
            <div className="bg-white rounded-lg p-3 space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Select reward to redeem:
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {loyaltyRewards
                    .filter(r => r.points_required <= userPoints)
                    .map(reward => (
                      <div
                        key={reward.id}
                        onClick={() => {
                          setSelectedReward(reward);
                          setPointsToRedeem(reward.points_required);
                          setDiscountAmount(reward.discount_amount || 0);
                        }}
                        className={`p-2 rounded border cursor-pointer transition ${selectedReward?.id === reward.id
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 hover:border-amber-300'
                          }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{reward.name}</p>
                            <p className="text-xs text-gray-600">{reward.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-amber-600">{reward.points_required} pts</p>
                            <p className="text-xs text-green-600">-${reward.discount_amount?.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {selectedReward && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-sm font-medium text-green-800">
                    You'll save ${discountAmount.toFixed(2)} with this reward!
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-0">
        {/* Progress Steps */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            {steps.map((step, index) => {
              const isActive = step.number <= currentStep;
              const StepIcon = step.icon;

              return (
                <div key={step.number} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 transition-all ${isActive
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                      }`}
                  >
                    <StepIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <p className={`text-xs sm:text-sm font-medium text-center ${isActive ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                    {step.title}
                  </p>
                  {index < steps.length - 1 && (
                    <div className={`absolute right-0 top-5 sm:top-6 w-12 sm:w-16 h-1 ${isActive ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-200'
                      }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content Card */}
        <Card className="bg-white shadow-xl border-0 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 sm:py-6">
            <CardTitle className="text-lg sm:text-2xl">
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
                      className={`p-4 sm:p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${selectedService === service.id.toString()
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

            {/* Step 2: Select Staff */}
            {currentStep === 2 && (
              loadingStaff ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                  <span className="ml-3 text-gray-500">Loading available staff...</span>
                </div>
              ) : staffList.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-medium text-gray-700">No staff available</p>
                  <p className="text-sm mt-1">There are currently no active staff members for this service. Please try another service or check back later.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                  {staffList.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => setSelectedStaff(member.id.toString())}
                      className={`p-4 sm:p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${selectedStaff === member.id.toString()
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

            {/* Step 3: Choose Date & Time */}
            {currentStep === 3 && (
              <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
                <div className="flex flex-col">
                  <h3 className="font-bold text-base sm:text-lg mb-4">Select Date</h3>
                  <div className="flex justify-center lg:justify-start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-2xl border border-purple-200"
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                    />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg mb-4">Available Times</h3>
                  {!selectedDate ? (
                    <p className="text-gray-500 italic">Please select a date first.</p>
                  ) : loadingSlots ? (
                    <div className="flex items-center text-purple-500 py-4">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading slots...
                    </div>
                  ) : availableTimeSlots.length === 0 ? (
                    <p className="text-red-500 italic">No slots available for this date.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 max-h-96 overflow-y-auto">
                      {availableTimeSlots.map((time) => (
                        <Button
                          key={time}
                          variant={selectedTime === time ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTime(time)}
                          className={`rounded-xl text-sm ${selectedTime === time
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0'
                            : 'border-purple-200 text-purple-600 hover:bg-purple-50'
                            }`}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Confirm Booking */}
            {currentStep === 4 && (
              <div className="space-y-6">
                {loyaltySettings && renderLoyaltyRedemption()}

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 sm:p-6">
                  <h3 className="font-bold text-base sm:text-lg mb-4">Payment Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="text-gray-600">Service Price:</span>
                      <span className="font-medium">${selectedServiceData?.price}</span>
                    </div>
                    {usePoints && (
                      <div className="flex justify-between text-sm sm:text-base text-green-600">
                        <span>Loyalty Discount:</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-purple-200 pt-3">
                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="font-bold">Final Total:</span>
                        <span className="font-bold text-purple-600 text-xl">
                          ${(selectedServiceData?.price - (usePoints ? discountAmount : 0)).toFixed(2)}
                        </span>
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