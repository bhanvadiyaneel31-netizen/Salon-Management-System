import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Clock, ArrowRight, Scissors, Sparkles, Heart, Users } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface ServicesPageProps {
  setCurrentView: (view: string) => void;
}

export function ServicesPage({ setCurrentView }: ServicesPageProps) {
  const serviceCategories = [
    {
      category: "Hair Services",
      icon: Scissors,
      color: "from-purple-500 to-purple-600",
      services: [
        {
          name: "Hair Cut & Style",
          description: "Professional cuts, styling, and blow-dry. Includes consultation and hair wash.",
          duration: 60,
          price: 85,
          image: "https://picsum.photos/seed/haircut-style/400/300"
        },
        {
          name: "Hair Coloring",
          description: "Full color, highlights, balayage, and color correction by expert colorists.",
          duration: 120,
          price: 150,
          image: "https://picsum.photos/seed/hair-coloring/400/300"
        },
        {
          name: "Hair Treatment",
          description: "Deep conditioning, keratin treatments, and scalp therapy.",
          duration: 75,
          price: 95,
          image: "https://picsum.photos/seed/hair-treatment/400/300"
        }
      ]
    },
    {
      category: "Facial Treatments",
      icon: Sparkles,
      color: "from-pink-500 to-pink-600",
      services: [
        {
          name: "Signature Facial",
          description: "Custom facial treatment tailored to your skin type and concerns.",
          duration: 75,
          price: 120,
          image: "https://picsum.photos/seed/signature-facial/400/300"
        },
        {
          name: "Anti-Aging Facial",
          description: "Advanced treatment targeting fine lines and wrinkles with premium products.",
          duration: 90,
          price: 180,
          image: "https://picsum.photos/seed/antiaging-facial/400/300"
        },
        {
          name: "Hydrating Facial",
          description: "Intensive moisture treatment for dry and dehydrated skin.",
          duration: 60,
          price: 100,
          image: "https://picsum.photos/seed/hydrating-facial/400/300"
        }
      ]
    },
    {
      category: "Nail Care",
      icon: Heart,
      color: "from-blue-500 to-blue-600",
      services: [
        {
          name: "Gel Manicure",
          description: "Long-lasting gel polish manicure with nail shaping and cuticle care.",
          duration: 45,
          price: 65,
          image: "https://picsum.photos/seed/gel-manicure/400/300"
        },
        {
          name: "Spa Pedicure",
          description: "Luxurious pedicure with foot soak, exfoliation, and massage.",
          duration: 60,
          price: 75,
          image: "https://picsum.photos/seed/spa-pedicure/400/300"
        },
        {
          name: "Nail Art",
          description: "Custom nail art designs and decorations by skilled nail technicians.",
          duration: 75,
          price: 85,
          image: "https://picsum.photos/seed/nail-art/400/300"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 sm:mb-6">
            Our Services
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            Discover our comprehensive range of beauty treatments designed to make you look and feel your absolute best. 
            All services are performed by certified professionals using premium products.
          </p>
        </div>

        {/* Service Categories */}
        <div className="space-y-12 sm:space-y-16">
          {serviceCategories.map((category) => {
            const Icon = category.icon;
            return (
              <section key={category.category}>
                {/* Category Header */}
                <div className={`bg-gradient-to-r ${category.color} rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-6 sm:mb-8`}>
                  <div className="flex items-center justify-center text-white">
                    <Icon className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mr-3 sm:mr-4" />
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">{category.category}</h2>
                  </div>
                </div>

                {/* Services Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {category.services.map((service) => (
                    <Card key={service.name} className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden">
                      <div className="relative h-48 overflow-hidden">
                        <ImageWithFallback
                          src={service.image}
                          alt={service.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-white/90 text-gray-900 font-bold text-base sm:text-lg px-3 py-1">
                            ${service.price}
                          </Badge>
                        </div>
                      </div>
                      
                      <CardHeader className="pb-3 px-4 sm:px-6">
                        <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                          {service.name}
                        </CardTitle>
                        <div className="flex items-center text-purple-600">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                          <span className="text-sm sm:text-base font-medium">{service.duration} minutes</span>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0 px-4 sm:px-6">
                        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">
                          {service.description}
                        </p>
                        
                        <Button
                          onClick={() => setCurrentView('booking')}
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 rounded-xl py-3"
                        >
                          Book This Service
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* CTA Section */}
        <section className="mt-16 sm:mt-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 text-center">
          <Users className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-white mx-auto mb-4 sm:mb-6" />
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
            Not Sure Which Service to Choose?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-purple-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Our expert team is here to help you find the perfect treatment for your needs. 
            Book a consultation or give us a call to discuss your beauty goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => setCurrentView('booking')}
              className="bg-white text-purple-600 hover:bg-gray-50 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 w-full sm:w-auto"
            >
              Book Consultation
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-white text-white hover:bg-white hover:text-purple-600 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 rounded-2xl w-full sm:w-auto"
            >
              Contact Us
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}