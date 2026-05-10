import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Camera,
  Trash2,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Save,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { api, staffAPI, API_BASE_URL } from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileSettingsPanelProps {
  userData: any;
  onSave: (updatedUser: any) => void;
  /** Extra stats shown in the preview card (staff: rating/reviews  customer: points/visits) */
  previewStats?: { label: string; value: string | number }[];
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  address: string;
  profile_image: string;
  password: string;
  currentPassword: string;
}

// ─── Password strength helper ──────────────────────────────────────────────────

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map: Record<number, { label: string; color: string }> = {
    1: { label: 'Weak', color: 'bg-red-400' },
    2: { label: 'Fair', color: 'bg-amber-400' },
    3: { label: 'Good', color: 'bg-blue-400' },
    4: { label: 'Strong', color: 'bg-emerald-500' },
  };
  return { score, ...(map[score] || { label: 'Weak', color: 'bg-red-400' }) };
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function ProfileSettingsPanel({ userData, onSave, previewStats }: ProfileSettingsPanelProps) {
  const isStaff = userData?.role === 'staff';

  const [form, setForm] = useState<FormState>({
    name: userData?.name || '',
    email: userData?.email || '',
    phone: userData?.phone || '',
    address: userData?.address || '',
    profile_image: userData?.profile_image || '',
    password: '',
    currentPassword: '',
  });

  // Sync if parent passes fresh userData (e.g. after Google OAuth resume)
  useEffect(() => {
    if (userData) {
      setForm(prev => ({
        ...prev,
        name: userData.name || prev.name,
        email: userData.email || prev.email,
        phone: userData.phone || prev.phone,
        address: userData.address || prev.address,
        profile_image: userData.profile_image || prev.profile_image,
      }));
    }
  }, [userData?.id]);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const passwordStrength = getPasswordStrength(form.password);

  // ── Validation ───────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const errs: Partial<FormState> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Invalid email address';
    }
    if (form.password && form.password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }
    if (form.password && !form.currentPassword) {
      errs.currentPassword = 'Current password is required to set a new password';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Image handling ────────────────────────────────────────────────────────────

  const validateImageFile = (file: File): { valid: boolean; error?: string } => {
    // Check MIME type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
    }

    // Check file size
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { valid: false, error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds 5MB limit` };
    }

    // Check file name (sanitize)
    if (!/^[\w\-. ]+$/.test(file.name)) {
      return { valid: false, error: 'Invalid filename. Use only letters, numbers, spaces, hyphens, underscores' };
    }

    return { valid: true };
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, maxRetries = 3) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Client-side validation
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setIsUploadingImage(true);
    setUploadError('');
    setUploadProgress(0);

    let retryCount = 0;
    const attemptUpload = async (): Promise<boolean> => {
      try {
        const formData = new FormData();
        formData.append('file', file);

        // Create XMLHttpRequest for progress tracking
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        });

        // Return promise-based interface
        return new Promise((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status === 200) {
              const response = JSON.parse(xhr.responseText);
              if (response.success) {
                resolve(true);
              } else {
                reject(new Error(response.error || 'Upload failed'));
              }
            } else if (xhr.status === 413) {
              reject(new Error('File is too large'));
            } else if (xhr.status === 429) {
              reject(new Error('Too many uploads. Please wait before trying again'));
            } else if (xhr.status >= 400 && xhr.status < 500) {
              reject(new Error(JSON.parse(xhr.responseText).error || 'Invalid file'));
            } else {
              reject(new Error('Server error. Please try again'));
            }
          };

          xhr.onerror = () => {
            reject(new Error('Network error. Please check your connection'));
          };

          xhr.timeout = 30000; // 30 second timeout
          xhr.ontimeout = () => {
            reject(new Error('Upload timed out. Please try again'));
          };

          const token = localStorage.getItem('auth_token');
          xhr.open('POST', `${API_BASE_URL}/users/upload-avatar`);
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          xhr.send(formData);
        });
      } catch (error) {
        // Retry logic
        if (retryCount < maxRetries && error instanceof Error && 
            (error.message.includes('Network error') || error.message.includes('timeout'))) {
          retryCount++;
          console.warn(`Upload failed, retrying (${retryCount}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
          return attemptUpload();
        }
        throw error;
      }
    };

    try {
      const success = await attemptUpload();
      
      if (success) {
        // Get the file as base64 for preview
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          setForm(prev => ({
            ...prev,
            profile_image: base64
          }));
          toast.success('Image uploaded successfully.');
          setUploadProgress(0);
          
          // Also update user data in local storage
          const stored = localStorage.getItem('user');
          if (stored) {
            const user = JSON.parse(stored);
            localStorage.setItem('user', JSON.stringify({ ...user, profile_image: base64 }));
            onSave({ ...userData, profile_image: base64 });
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to upload image';
      setUploadError(errorMsg);
      toast.error(errorMsg);
      console.error('Image upload error:', error);
      setUploadProgress(0);
    } finally {
      setIsUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!form.profile_image) return;
    if (!window.confirm('Remove your profile picture?')) return;

    setIsUploadingImage(true);
    try {
      if (isStaff) {
        await staffAPI.updateProfile({ profile_image: '' });
      } else {
        await api.auth.updateProfile({ profile_image: '' });
      }
      setForm(prev => ({ ...prev, profile_image: '' }));
      const stored = api.auth.getCurrentUser();
      if (stored) localStorage.setItem('user', JSON.stringify({ ...stored, profile_image: '' }));
      toast.success('Profile picture removed');
    } catch {
      toast.error('Failed to remove profile picture');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // ── Save handler ──────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
      };
      if (form.password) {
        payload.password = form.password;
        payload.currentPassword = form.currentPassword;
      }

      let result: any;
      if (isStaff) {
        result = await staffAPI.updateProfile(payload);
      } else {
        result = await api.auth.updateProfile(payload);
      }

      const updatedUser = {
        ...userData,
        name: result?.name || form.name,
        email: result?.email || form.email,
        phone: result?.phone || form.phone,
        address: result?.address || form.address,
        profile_image: result?.profile_image ?? form.profile_image,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      onSave(updatedUser);

      // Clear password fields on success
      setForm(prev => ({ ...prev, password: '', currentPassword: '' }));
      toast.success('Profile updated successfully');
    } catch (err: any) {
      const msg = err?.message || 'Failed to update profile';
      // Specific error cases
      if (msg.toLowerCase().includes('email')) toast.error(msg);
      else if (msg.toLowerCase().includes('password')) toast.error(msg);
      else if (msg.toLowerCase().includes('401') || msg.toLowerCase().includes('session')) {
        toast.error('Session expired — please log in again');
      } else {
        toast.error(msg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const field = (key: keyof FormState) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({ ...prev, [key]: e.target.value }));
      if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
    },
  });

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <p className="text-gray-500 text-sm">Manage your personal information and account security</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Form ───────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Personal Information */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <User className="w-4 h-4 text-purple-500" />
                Personal Information
              </CardTitle>
              <p className="text-xs text-gray-400">
                Changes are saved to the database and reflected in real-time.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="psp-name">Full Name <span className="text-red-400">*</span></Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="psp-name"
                      className={`pl-10 rounded-xl border-purple-200 focus:border-purple-400 ${errors.name ? 'border-red-400' : ''}`}
                      placeholder="Your full name"
                      {...field('name')}
                    />
                  </div>
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="psp-email">Email Address <span className="text-red-400">*</span></Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="psp-email"
                      type="email"
                      className={`pl-10 rounded-xl border-purple-200 focus:border-purple-400 ${errors.email ? 'border-red-400' : ''}`}
                      placeholder="your@email.com"
                      {...field('email')}
                    />
                  </div>
                  {errors.email
                    ? <p className="text-xs text-red-500">{errors.email}</p>
                    : <p className="text-[10px] text-gray-400 italic px-1">Changing email updates your login across all devices.</p>
                  }
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="psp-phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="psp-phone"
                      type="tel"
                      className="pl-10 rounded-xl border-purple-200 focus:border-purple-400"
                      placeholder="+1 (555) 000-0000"
                      {...field('phone')}
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <Label htmlFor="psp-address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="psp-address"
                      className="pl-10 rounded-xl border-purple-200 focus:border-purple-400"
                      placeholder="123 Main St, City"
                      {...field('address')}
                    />
                  </div>
                </div>

                {/* Admin-controlled category (staff only, read-only) */}
                {isStaff && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="flex items-center gap-2">
                      Primary Service Category
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Admin Controlled</span>
                    </Label>
                    <Input
                      value={userData?.category || 'Not Assigned'}
                      disabled
                      className="rounded-xl bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-amber-600 italic px-1">
                      Your service category is set by administration.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-500" />
                Change Password
              </CardTitle>
              <p className="text-xs text-gray-400">Leave blank to keep your current password.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* New Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="psp-new-pw">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="psp-new-pw"
                      type={showPassword ? 'text' : 'password'}
                      className={`pl-10 pr-10 rounded-xl border-purple-200 focus:border-purple-400 ${errors.password ? 'border-red-400' : ''}`}
                      placeholder="Min 8 characters"
                      {...field('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}

                  {/* Strength bar */}
                  {form.password && (
                    <div className="space-y-1 pt-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map(n => (
                          <div
                            key={n}
                            className={`h-1 flex-1 rounded-full transition-all ${n <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200'}`}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400">{passwordStrength.label}</p>
                    </div>
                  )}
                </div>

                {/* Current Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="psp-cur-pw">Current Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="psp-cur-pw"
                      type={showCurrentPassword ? 'text' : 'password'}
                      className={`pl-10 pr-10 rounded-xl border-purple-200 focus:border-purple-400 ${errors.currentPassword ? 'border-red-400' : ''}`}
                      placeholder="Required for password changes"
                      {...field('currentPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.currentPassword && <p className="text-xs text-red-500">{errors.currentPassword}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save button */}
          <Button
            id="psp-save-btn"
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl h-12 shadow-md border-0 text-sm font-semibold"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Saving Changes...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" />Save Profile Settings</>
            )}
          </Button>
        </div>

        {/* ── Right: Profile Preview ────────────────────────────────────────── */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg h-fit">
          <CardHeader>
            <CardTitle className="text-base font-bold">Profile Preview</CardTitle>
          </CardHeader>
          <CardContent className="text-center pb-8 space-y-2">

            {/* Avatar */}
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center border-4 border-white shadow-md overflow-hidden relative">
                {form.profile_image ? (
                  <img
                    src={form.profile_image}
                    alt={form.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-purple-300" />
                )}
                {isUploadingImage && uploadProgress > 0 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-xs text-white font-medium">{uploadProgress}%</span>
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleProfileImageUpload}
                aria-label="Upload profile picture"
              />

              {/* Camera button */}
              <button
                className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-purple-100 text-purple-600 hover:text-purple-700 hover:scale-110 transition-all disabled:opacity-50"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                title="Change profile picture"
                aria-label="Change profile picture"
              >
                {isUploadingImage
                  ? <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                  : <Camera className="w-4 h-4" />
                }
              </button>
            </div>

            {uploadError && (
              <p className="text-[10px] text-red-500 max-w-[200px] mx-auto leading-tight">{uploadError}</p>
            )}

            {/* Remove photo */}
            {form.profile_image && (
              <button
                onClick={handleRemoveImage}
                disabled={isUploadingImage}
                className="text-[10px] text-red-400 hover:text-red-600 flex items-center gap-1 mx-auto disabled:opacity-40 transition-colors"
                title="Remove profile picture"
              >
                <Trash2 className="w-3 h-3" />
                Remove photo
              </button>
            )}

            {!form.profile_image && (
              <p className="text-[10px] text-gray-400">Click the camera icon to upload a photo</p>
            )}

            <h3 className="font-bold text-gray-900 mt-2">{form.name || 'Your Name'}</h3>
            <p className="text-xs text-gray-500 uppercase tracking-widest">{userData?.role}</p>

            {previewStats && previewStats.length > 0 && (
              <div className={`mt-6 pt-6 border-t border-gray-100 grid grid-cols-${previewStats.length} gap-4`}>
                {previewStats.map(stat => (
                  <div key={stat.label}>
                    <p className="text-lg font-bold text-purple-600">{stat.value}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
