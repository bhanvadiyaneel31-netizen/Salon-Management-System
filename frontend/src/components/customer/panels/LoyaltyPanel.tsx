import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Button } from '../../ui/button';
import { Progress } from '../../ui/progress';
import { Star, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { api } from '../../../services/api';

interface LoyaltyPanelProps {
  profile: { loyaltyPoints: number };
}

export function LoyaltyPanel({
  profile
}: LoyaltyPanelProps) {
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [loyaltySettings, setLoyaltySettings] = useState<any>(null);
  const [loyaltyRewards, setLoyaltyRewards] = useState<any[]>([]);

  const loadLoyaltyData = async () => {
    try {
      const [history, settings, rewards] = await Promise.all([
        api.loyalty.getHistory(),
        api.loyalty.getSettings(),
        api.loyalty.getRewards()
      ]);
      setPointsHistory(history);
      setLoyaltySettings(settings);
      setLoyaltyRewards(rewards);
    } catch (error) {
      console.error('Failed to load loyalty data:', error);
    }
  };

  useEffect(() => {
    loadLoyaltyData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-gray-500">Track your points and redeem exclusive rewards</p>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">Total Balance</p>
          <p className="text-2xl font-bold text-purple-600 flex items-center justify-end gap-2">
            <Star className="w-6 h-6 fill-purple-600" />
            {profile.loyaltyPoints} pts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Points History</CardTitle>
            <CardDescription>Ledger of your earnings and redemptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pointsHistory.length > 0 ? (
                pointsHistory.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 hover:bg-white transition-all border border-transparent hover:border-purple-100">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${log.type === 'earn' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                        {log.type === 'earn' ? <TrendingUp className="w-5 h-5" /> : <TrendingUp className="w-5 h-5 rotate-180" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{log.reason || (log.type === 'earn' ? 'Service Reward' : 'Point Redemption')}</p>
                        <p className="text-[10px] text-gray-400">{format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}</p>
                      </div>
                    </div>
                    <p className={`font-bold ${log.type === 'earn' ? 'text-green-600' : 'text-amber-600'}`}>
                      {log.type === 'earn' ? '+' : '-'}{log.points}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-10" />
                  <p>No activity yet. Start booking to earn points!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-3xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white">Reward Tiers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {/* Fixed Cashback Reward */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">$</div>
                <div>
                  <p className="font-bold text-sm">Point Redemption</p>
                  <p className="text-xs text-purple-100">100 pts = ${loyaltySettings ? (100 * loyaltySettings.redemption_rate).toFixed(0) : '10'} Discount</p>
                </div>
              </div>

              {/* Dynamic Rewards from DB */}
              {loyaltyRewards.map((reward, idx) => (
                <div key={reward.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">{idx + 1}</div>
                  <div>
                    <p className="font-bold text-sm">{reward.title}</p>
                    <p className="text-xs text-purple-100">{reward.points_required} pts = {reward.description || 'Special Offer'}</p>
                  </div>
                </div>
              ))}
            </div>

            {loyaltyRewards.length > 0 && (
              <div className="pt-4 border-t border-white/20">
                <p className="text-[10px] uppercase tracking-widest opacity-80 mb-2">Next Milestone</p>
                {(() => {
                  const nextReward = loyaltyRewards.find(r => r.points_required > profile.loyaltyPoints) || loyaltyRewards[loyaltyRewards.length - 1];
                  const progress = Math.min((profile.loyaltyPoints / nextReward.points_required) * 100, 100);
                  return (
                    <>
                      <div className="flex justify-between text-xs mb-2">
                        <span>{profile.loyaltyPoints} pts</span>
                        <span>{nextReward.points_required} pts</span>
                      </div>
                      <Progress value={progress} className="h-1.5 bg-white/20" />
                    </>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
