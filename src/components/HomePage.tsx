import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Star, Scissors, Sparkles, Heart, ArrowRight } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface HomePageProps {
  setCurrentView: (view: string) => void;
}

export function HomePage({ setCurrentView }: HomePageProps) {
  const services = [
    {
      name: "Hair Styling",
      description: "Professional cuts, coloring, and styling",
      price: "From $85",
      icon: Scissors,
      image: "https://picsum.photos/seed/hair-styling/400/300"
    },
    {
      name: "Facial Treatments",
      description: "Rejuvenating facial care and treatments",
      price: "From $120",
      icon: Sparkles,
      image: "https://picsum.photos/seed/facial-treatment/400/300"
    },
    {
      name: "Nail Care",
      description: "Manicures, pedicures, and nail art",
      price: "From $65",
      icon: Heart,
      image: "https://picsum.photos/seed/nail-care/400/300"
    }
  ];

  const reviews = [
    {
      name: "Sarah Johnson",
      rating: 5,
      text: "Amazing experience! The staff is so professional and the salon has such a relaxing atmosphere.",
      service: "Hair Styling"
    },
    {
      name: "Emma Wilson",
      rating: 5,
      text: "Best facial I've ever had! My skin feels incredible. Will definitely be coming back.",
      service: "Facial Treatment"
    },
    {
      name: "Lisa Chen",
      rating: 5,
      text: "Love my new nail art! The attention to detail is outstanding. Highly recommend!",
      service: "Nail Care"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-800 bg-clip-text text-transparent leading-tight">
                Beauty & Wellness
                <br />
                Redefined
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed">
                Experience luxury beauty treatments in our modern salon. Book your appointment today and let our expert stylists transform your look.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  onClick={() => setCurrentView('booking')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
                >
                  Book Appointment Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setCurrentView('services')}
                  className="border-2 border-purple-200 text-purple-600 hover:bg-purple-50 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 rounded-2xl w-full sm:w-auto"
                >
                  View Services
                </Button>
              </div>
            </div>
            <div className="relative order-first lg:order-last">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl blur-3xl opacity-20"></div>
              <ImageWithFallback
                src="https://picsum.photos/seed/salon-interior/800/600"
                alt="Modern salon interior"
                className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[500px] object-cover rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Top Services
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">
              Discover our most popular treatments designed to make you look and feel your best
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <Card key={index} className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden">
                  <div className="relative h-48 overflow-hidden">
                    <ImageWithFallback
                      src={service.image}
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div className="absolute bottom-4 left-4">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-3">
                        <Icon className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4">{service.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-base sm:text-lg font-bold text-purple-600">{service.price}</span>
                      <Button
                        size="sm"
                        onClick={() => setCurrentView('booking')}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 rounded-xl"
                      >
                        Book Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Clients Say
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600">
              Don't just take our word for it - hear from our satisfied customers
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {reviews.map((review, index) => (
              <Card key={index} className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl p-4 sm:p-6 hover:shadow-xl transition-all duration-300">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm sm:text-base text-gray-700 mb-4 italic">"{review.text}"</p>
                  <div className="border-t border-gray-100 pt-4">
                    <p className="font-medium text-gray-900">{review.name}</p>
                    <p className="text-xs sm:text-sm text-purple-600">{review.service}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-purple-500 to-pink-500">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
            Ready to Transform Your Look?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-purple-100 mb-6 sm:mb-8">
            Book your appointment today and experience the difference at Bella Salon
          </p>
          <Button
            size="lg"
            onClick={() => setCurrentView('booking')}
            className="bg-white text-purple-600 hover:bg-gray-50 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 w-full sm:w-auto"
          >
            Schedule Your Visit
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
}