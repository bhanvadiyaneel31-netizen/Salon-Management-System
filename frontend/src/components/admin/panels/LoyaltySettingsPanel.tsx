import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Badge } from "../../ui/badge";
import { Settings, UserCog, Award, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../services/api";

export function LoyaltySettingsPanel() {
  const [loyaltySettings, setLoyaltySettings] = useState<any>(null);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [adjustmentUser, setAdjustmentUser] = useState("");
  const [adjustmentPoints, setAdjustmentPoints] = useState("");
  const [adjustmentType, setAdjustmentType] = useState("earn");
  const [isAdjusting, setIsAdjusting] = useState(false);

  const [loyaltyRewards, setLoyaltyRewards] = useState<any[]>([]);
  const [isLoadingRewards, setIsLoadingRewards] = useState(false);
  const [newReward, setNewReward] = useState({ title: "", description: "", points_required: "", discount_percentage: "" });
  const [isAddingReward, setIsAddingReward] = useState(false);

  const loadRewards = async () => {
    setIsLoadingRewards(true);
    try {
      const data = await api.loyalty.getRewards();
      setLoyaltyRewards(data || []);
    } catch (err) {
      console.error("Failed to load rewards:", err);
    } finally {
      setIsLoadingRewards(false);
    }
  };

  const loadLoyaltySettings = async () => {
    try {
      const data = await api.loyalty.getSettings();
      setLoyaltySettings(data);
      await loadRewards();
    } catch (err) {
      console.error("Failed to load loyalty settings:", err);
    }
  };

  useEffect(() => {
    loadLoyaltySettings();
  }, []);

  const updateLoyaltySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loyaltySettings) return;
    setIsUpdatingSettings(true);
    try {
      await api.loyalty.updateSettings({
        points_per_dollar: loyaltySettings.points_per_dollar,
        redemption_rate: loyaltySettings.redemption_rate,
        max_discount_percent: loyaltySettings.max_discount_percent,
        min_booking_amount: loyaltySettings.min_booking_amount,
        points_expiry_days: loyaltySettings.points_expiry_days
      });
      toast.success("Loyalty settings updated successfully");
      await loadLoyaltySettings();
    } catch (err) {
      console.error("Failed to update loyalty settings:", err);
      toast.error("Failed to update loyalty settings");
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleAddReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReward.title || !newReward.points_required) {
      toast.error("Please fill in reward title and points");
      return;
    }
    setIsAddingReward(true);
    try {
      await api.loyalty.addReward({
        title: newReward.title,
        description: newReward.description,
        points_required: parseInt(newReward.points_required),
        discount_percentage: parseFloat(newReward.discount_percentage) || 0
      });
      setNewReward({ title: "", description: "", points_required: "", discount_percentage: "" });
      await loadRewards();
      toast.success("Reward added successfully");
    } catch (err) {
      console.error("Failed to add reward:", err);
      toast.error("Failed to add reward");
    } finally {
      setIsAddingReward(false);
    }
  };

  const handleDeleteReward = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this reward?")) return;
    try {
      await api.loyalty.deleteReward(id);
      toast.success("Reward deleted successfully");
      await loadRewards();
    } catch (err) {
      console.error("Failed to delete reward:", err);
      toast.error("Failed to delete reward");
    }
  };

  const handleLoyaltyAdjustment = async () => {
    if (!adjustmentUser || !adjustmentPoints) {
      toast.error("Please provide user ID/Email and points");
      return;
    }
    setIsAdjusting(true);
    try {
      await api.loyalty.adjust({
        user_id: adjustmentUser,
        email: adjustmentUser.includes("@") ? adjustmentUser : undefined,
        points: parseInt(adjustmentPoints),
        type: adjustmentType as any,
        description: "Manual adjustment by admin (loyalty-settings)"
      });
      toast.success("Loyalty points adjusted successfully");
      setAdjustmentPoints("");
      setAdjustmentUser("");
    } catch (err: any) {
      toast.error(err.message || "Failed to adjust points");
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Rules & Rates */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-900">
              <Settings className="w-5 h-5 text-purple-500" />
              Earning & Redemption Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loyaltySettings ? (
              <form onSubmit={updateLoyaltySettings} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Points per Dollar (Earn)</Label>
                    <Input
                      type="number"
                      value={loyaltySettings.points_per_dollar}
                      onChange={(e) => setLoyaltySettings({ ...loyaltySettings, points_per_dollar: parseInt(e.target.value) })}
                      className="rounded-xl border-purple-100"
                    />
                    <p className="text-[10px] text-gray-400">1 Dollar spent = X points earned</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Redemption Rate ($ per Pt)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={loyaltySettings.redemption_rate}
                      onChange={(e) => setLoyaltySettings({ ...loyaltySettings, redemption_rate: parseFloat(e.target.value) })}
                      className="rounded-xl border-purple-100"
                    />
                    <p className="text-[10px] text-gray-400">1 Point = $X Discount</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Max Discount %</Label>
                    <Input
                      type="number"
                      value={loyaltySettings.max_discount_percent}
                      onChange={(e) => setLoyaltySettings({ ...loyaltySettings, max_discount_percent: parseInt(e.target.value) })}
                      className="rounded-xl border-purple-100"
                    />
                    <p className="text-[10px] text-gray-400">Max points discount per booking</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Points Expiry (Days)</Label>
                    <Input
                      type="number"
                      value={loyaltySettings.points_expiry_days}
                      onChange={(e) => setLoyaltySettings({ ...loyaltySettings, points_expiry_days: parseInt(e.target.value) })}
                      className="rounded-xl border-purple-100"
                    />
                    <p className="text-[10px] text-gray-400">Points expire after X days of inactivity</p>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isUpdatingSettings}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl h-11"
                >
                  {isUpdatingSettings ? "Updating..." : "Save Configuration"}
                </Button>
              </form>
            ) : (
              <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Adjustments */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-900">
              <UserCog className="w-5 h-5 text-pink-500" />
              Manual Point Adjustment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 bg-purple-50/50 rounded-2xl border border-purple-100">
              <p className="text-sm text-gray-600 mb-4">
                Use this tool to manually award or deduct points for specific users.
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>User ID / Email</Label>
                  <Input
                    placeholder="Search user..."
                    value={adjustmentUser}
                    onChange={(e) => setAdjustmentUser(e.target.value)}
                    className="rounded-xl border-purple-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Points</Label>
                    <Input
                      type="number"
                      placeholder="50"
                      value={adjustmentPoints}
                      onChange={(e) => setAdjustmentPoints(e.target.value)}
                      className="rounded-xl border-purple-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Action</Label>
                    <Select value={adjustmentType} onValueChange={setAdjustmentType}>
                      <SelectTrigger className="rounded-xl border-purple-100">
                        <SelectValue placeholder="Action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="earn">Add Points</SelectItem>
                        <SelectItem value="redeem">Deduct Points</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={handleLoyaltyAdjustment}
                  disabled={isAdjusting}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
                >
                  {isAdjusting ? "Applying..." : "Apply Adjustment"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rewards Management */}
        <Card className="lg:col-span-2 border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-900">
              <Award className="w-5 h-5 text-yellow-500" />
              Reward Tiers & Offers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Add New Reward Form */}
              <div className="md:col-span-1 space-y-4 p-6 bg-yellow-50/50 rounded-2xl border border-yellow-100 h-fit">
                <h4 className="font-bold text-gray-900">Add New Reward</h4>
                <form onSubmit={handleAddReward} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      placeholder="e.g. Free Haircut"
                      value={newReward.title}
                      onChange={(e) => setNewReward({ ...newReward, title: e.target.value })}
                      className="rounded-xl border-yellow-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Points Required</Label>
                    <Input
                      type="number"
                      placeholder="1000"
                      value={newReward.points_required}
                      onChange={(e) => setNewReward({ ...newReward, points_required: e.target.value })}
                      className="rounded-xl border-yellow-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="Brief details..."
                      value={newReward.description}
                      onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                      className="rounded-xl border-yellow-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Discount Percentage (%)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 10"
                      min={0}
                      max={100}
                      value={newReward.discount_percentage}
                      onChange={(e) => setNewReward({ ...newReward, discount_percentage: e.target.value })}
                      className="rounded-xl border-yellow-100"
                    />
                    <p className="text-[10px] text-gray-400">
                      How much % off on any service when this reward is redeemed
                    </p>
                  </div>
                  <Button
                    type="submit"
                    disabled={isAddingReward}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl"
                  >
                    {isAddingReward ? "Adding..." : "Add Reward"}
                  </Button>
                </form>
              </div>

              {/* Rewards List */}
              <div className="md:col-span-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reward</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingRewards ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-yellow-500" />
                        </TableCell>
                      </TableRow>
                    ) : loyaltyRewards.map((reward) => (
                      <TableRow key={reward.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">{reward.title}</div>
                          <div className="text-[10px] text-gray-500">{reward.description}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-0">
                            {reward.points_required} pts
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-700 border-0">
                            {reward.discount_percentage > 0 ? `${reward.discount_percentage}% off` : "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={reward.is_active ? "default" : "secondary"}>
                            {reward.is_active ? "Active" : "Hidden"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                            onClick={() => handleDeleteReward(reward.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!isLoadingRewards && loyaltyRewards.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-400 text-sm">
                          No rewards configured yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
