import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Star, User, MessageSquare, Calendar as CalendarIcon, Quote } from 'lucide-react';
import { format } from 'date-fns';

interface ReviewsPanelProps {
  reviews: any[];
  staffRating: { average: number; count: number };
}

export function ReviewsPanel({ reviews, staffRating }: ReviewsPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Customer Feedback</h2>
        <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-2xl border border-purple-100">
          <Star className="w-5 h-5 text-purple-600 fill-purple-600" />
          <span className="font-bold text-purple-700">{staffRating.average.toFixed(1)}</span>
          <span className="text-xs text-purple-400">({staffRating.count} reviews)</span>
        </div>
      </div>

      <div className="grid gap-4">
        {reviews.length === 0 ? (
          <Card className="border-dashed border-2 bg-gray-50/50">
            <CardContent className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No reviews yet. Keep up the great work!</p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300 group bg-white">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="p-6 md:w-48 bg-gray-50 flex flex-col justify-center items-center text-center border-b md:border-b-0 md:border-r border-gray-100">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                      <User className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="font-bold text-gray-900 text-sm truncate w-full">{review.customer_name}</p>
                    <p className="text-[10px] text-gray-400 uppercase mt-1">Customer</p>
                  </div>
                  <div className="p-6 flex-1 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                          />
                        ))}
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-600 border-purple-100">
                        {review.service_name}
                      </Badge>
                      <span className="text-xs text-gray-400 ml-auto flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {format(new Date(review.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="relative">
                      <Quote className="w-8 h-8 text-purple-100 absolute -top-2 -left-2 rotate-180" />
                      <p className="text-gray-700 text-sm leading-relaxed relative z-10 pl-4 italic">
                        "{review.comment}"
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
