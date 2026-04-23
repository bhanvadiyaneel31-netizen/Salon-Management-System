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
  useEffect(() => {
    if (!selectedService) {
      setStaffList([]);
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
          console.error("Service not found");
          setStaffList([]);
          return;
        }

        const data = await api.staff.getAvailable(
          '',
          selectedService?.toString()
        );

        setStaffList(data);
      } catch (error) {
        toast.error('Failed to load staff');
      } finally {
        setLoadingStaff(false);
      }
    };
    loadStaff();
  }, [selectedService]);

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
        const [settings, profile, rewards] = await Promise.all([
          api.loyalty.getSettings(),
          api.auth.getProfile(),
          api.loyalty.getRewards()
        ]);
        setLoyaltySettings(settings);
        setUserPoints(profile.loyalty_points || 0);
        setLoyaltyRewards(rewards);
      } catch (err) {
        console.error('Failed to load loyalty info:', err);
      }
    };
    fetchLoyaltyInfo();
  }, []);

  // Calculate Loyalty Discount
  useEffect(() => {
    if (!usePoints || !loyaltySettings || !selectedServiceData) {
      setDiscountAmount(0);
      setPointsToRedeem(0);
      return;
    }

    const price = selectedServiceData.price;
    if (price < loyaltySettings.min_booking_amount) {
      toast.error(`Minimum $${loyaltySettings.min_booking_amount} required to use points`);
      setUsePoints(false);
      setSelectedReward(null);
      return;
    }

    // Max discount allowed by settings
    const maxDiscountAllowed = (price * loyaltySettings.max_discount_percent) / 100;

    // Points to use: either the fixed reward points or all available points
    const pointsToUse = selectedReward ? selectedReward.points_required : userPoints;

    // Value of those points
    const potentialDiscount = pointsToUse * loyaltySettings.redemption_rate;

    // Actual discount is limited by the max allowed
    const actualDiscount = Math.min(maxDiscountAllowed, potentialDiscount);

    // Points actually required for the given discount (recalculates downwards if capped)
    const requiredPoints = Math.ceil(actualDiscount / loyaltySettings.redemption_rate);

    setDiscountAmount(actualDiscount);
    setPointsToRedeem(requiredPoints);
  }, [usePoints, loyaltySettings, selectedServiceData, userPoints, selectedReward]);

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

      // Final validation of time slot buffer for same-day bookings
      const isToday = format(selectedDate!, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
      if (isToday && selectedTime) {
        const [h, m] = selectedTime.split(':').map(Number);
        const slotMins = h * 60 + m;
        const now = new Date();
        const nowMins = now.getHours() * 60 + now.getMinutes();
        if (slotMins <= nowMins + 15) {
          toast.error('The selected time slot is no longer available. Please choose a later time.');
          setSelectedTime('');
          setCurrentStep(3); // Go back to slot selection
          return;
        }
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
          staff_id: selectedStaff || null,
          appointment_date: format(selectedDate, 'yyyy-MM-dd'),
          appointment_time: selectedTime,
          notes: '',
          points_redeemed: (usePoints && !selectedReward) ? pointsToRedeem : 0,
          discount_amount: (usePoints && !selectedReward) ? discountAmount : 0,
          reward_id: (usePoints && selectedReward) ? selectedReward.id : null
        } as any);
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
    if (currentStep > 1) {
      if (currentStep === 2 && initialServiceId) {
        onResetSelection?.();
      }
      setCurrentStep(currentStep - 1);
    } else {
      onResetSelection?.();
      setCurrentView('home');
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedService !== '';
      case 2: return selectedStaff !== '';
      case 3: return !!(selectedDate && selectedTime !== '');
      case 4: return true;
      default: return false;
    }
  };

  // Update Loyalty Redemption UI in Step 4
  const renderLoyaltyRedemption = () => {
    if (!userPoints || !loyaltySettings) return null;

    const canRedeemCashback = selectedServiceData?.price >= loyaltySettings.min_booking_amount;
    const availableRewards = loyaltyRewards.filter(r => userPoints >= r.points_required);

    if (!canRedeemCashback && availableRewards.length === 0) return null;

    return (
      <div className="bg-white border border-purple-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-amber-100 p-2 rounded-xl">
            <Coins className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900">Loyalty Rewards</p>
            <p className="text-sm text-gray-500">You have {userPoints} points available</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Option 1: Direct Discount (Cashback) */}
          {canRedeemCashback && (
            <div
              onClick={() => {
                if (usePoints && !selectedReward) setUsePoints(false);
                else {
                  setUsePoints(true);
                  setSelectedReward(null);
                }
              }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${usePoints && !selectedReward ? 'border-purple-500 bg-purple-50' : 'border-gray-100 hover:border-purple-200'
                }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm">Use Points for Discount</p>
                  <p className="text-xs text-gray-500">Redeem {pointsToRedeem} pts for ${discountAmount.toFixed(0)} off</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${usePoints && !selectedReward ? 'border-purple-500 bg-purple-500' : 'border-gray-300'}`}>
                  {usePoints && !selectedReward && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
            </div>
          )}

          {/* Option 2: Specific Rewards */}
          {availableRewards.map((reward) => (
            <div
              key={reward.id}
              onClick={() => {
                setUsePoints(true);
                setSelectedReward(reward);
              }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedReward?.id === reward.id ? 'border-amber-500 bg-amber-50' : 'border-gray-100 hover:border-amber-200'
                }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-amber-500" />
                  <div>
                    <p className="font-bold text-sm">{reward.title}</p>
                    <p className="text-xs text-gray-500">{reward.points_required} pts • {reward.description}</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedReward?.id === reward.id ? 'border-amber-500 bg-amber-500' : 'border-gray-300'}`}>
                  {selectedReward?.id === reward.id && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        {usePoints && (
          <div className="mt-6 pt-4 border-t border-purple-50 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Points to be deducted:</span>
              <span className="font-bold text-amber-600">
                -{pointsToRedeem} pts
              </span>
            </div>
            {selectedReward ? (
              <p className="text-xs text-green-600 font-medium mt-2">
                ✨ Reward Applied: {selectedReward.title}
              </p>
            ) : (
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Cashback Discount:</span>
                <span className="font-bold text-green-600">-${discountAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };


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
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isCompleted ? 'bg-green-500 text-white' : isActive ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : 'bg-gray-200 text-gray-500'
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