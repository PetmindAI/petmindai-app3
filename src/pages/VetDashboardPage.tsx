import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface VetProfile {
  id: string;
  vet_name: string;
  clinic_name: string;
  specialization: string;
  experience_years: number;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  consultation_fee: number;
  rating: number;
  total_reviews: number;
  phone: string;
  email: string;
  availability: string;
  is_approved: boolean;
}

interface Review {
  id: string;
  rating: number;
  review_text: string;
  created_at: string;
  user_profiles?: {
    full_name: string;
  };
}

export default function VetDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<VetProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    vet_name: '',
    clinic_name: '',
    specialization: '',
    experience_years: 0,
    address: '',
    city: '',
    latitude: 0,
    longitude: 0,
    consultation_fee: 0,
    phone: '',
    email: '',
    availability: 'Mon-Fri: 9AM-6PM',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchProfile();
    fetchReviews();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('vets')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile(data);
        setFormData({
          vet_name: data.vet_name,
          clinic_name: data.clinic_name,
          specialization: data.specialization,
          experience_years: data.experience_years,
          address: data.address,
          city: data.city,
          latitude: data.latitude,
          longitude: data.longitude,
          consultation_fee: data.consultation_fee,
          phone: data.phone,
          email: data.email,
          availability: data.availability,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('vet_reviews')
        .select(`
          *,
          user_profiles:user_id (full_name)
        `)
        .eq('vet_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (profile) {
        const { error } = await supabase
          .from('vets')
          .update(formData)
          .eq('id', profile.id);

        if (error) throw error;
        alert('Profile updated successfully!');
      } else {
        const { error } = await supabase
          .from('vets')
          .insert({
            ...formData,
            user_id: user?.id,
          });

        if (error) throw error;
        alert('Profile created successfully! Your profile will be visible once approved by admin.');
      }

      fetchProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pt-20 pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-pulse">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pt-20 pb-24 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Vet Dashboard</h1>
          {profile && !profile.is_approved && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-lg">
              Your profile is pending admin approval
            </div>
          )}
          {profile && profile.is_approved && (
            <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded-lg">
              Your profile is approved and visible to users
            </div>
          )}
        </div>

        {profile && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="w-6 h-6 text-yellow-500 fill-current" />
                  <span className="text-3xl font-bold text-gray-900">{profile.rating.toFixed(1)}</span>
                </div>
                <p className="text-gray-600">Average Rating</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{profile.total_reviews}</p>
                <p className="text-gray-600">Total Reviews</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">₹{profile.consultation_fee}</p>
                <p className="text-gray-600">Consultation Fee</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {profile ? 'Update Profile' : 'Create Profile'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Veterinarian Name
                </label>
                <input
                  type="text"
                  value={formData.vet_name}
                  onChange={(e) => setFormData({ ...formData, vet_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clinic Name
                </label>
                <input
                  type="text"
                  value={formData.clinic_name}
                  onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialization
                </label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., General Practice, Surgery, Dermatology"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience (years)
                </label>
                <input
                  type="number"
                  value={formData.experience_years}
                  onChange={(e) => setFormData({ ...formData, experience_years: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Consultation Fee (₹)
                </label>
                <input
                  type="number"
                  value={formData.consultation_fee}
                  onChange={(e) => setFormData({ ...formData, consultation_fee: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  min="0"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Availability
              </label>
              <input
                type="text"
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Mon-Fri: 9AM-6PM"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : profile ? 'Update Profile' : 'Create Profile'}
            </button>
          </form>
        </div>

        {profile && reviews.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Reviews</h2>
            <div className="space-y-6">
              {reviews.map(review => (
                <div key={review.id} className="border-b pb-6 last:border-b-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-900 mb-2">{review.review_text}</p>
                  <p className="text-sm text-gray-600">
                    by {review.user_profiles?.full_name || 'Anonymous'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
