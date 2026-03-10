import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import { Tag, Plus, Trash2, Calendar, Percent, Users, ToggleLeft, ToggleRight } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  discount_percentage: number;
  expiry_date: string;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  created_at: string;
}

export default function AdminCouponsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discount_percentage: '',
    expiry_date: '',
    max_uses: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    if (!isAdmin) {
      navigate('/');
      return;
    }

    fetchCoupons();
  }, [user, isAdmin, authLoading, navigate]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      alert('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.discount_percentage || !formData.expiry_date || !formData.max_uses) {
      alert('Please fill in all fields');
      return;
    }

    const discountPercentage = parseInt(formData.discount_percentage);
    if (discountPercentage < 1 || discountPercentage > 100) {
      alert('Discount percentage must be between 1 and 100');
      return;
    }

    const maxUses = parseInt(formData.max_uses);
    if (maxUses < 1) {
      alert('Maximum uses must be at least 1');
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase.from('coupons').insert({
        code: formData.code.toUpperCase(),
        discount_percentage: discountPercentage,
        expiry_date: new Date(formData.expiry_date).toISOString(),
        max_uses: maxUses,
        created_by: user?.id,
      });

      if (error) throw error;

      setFormData({
        code: '',
        discount_percentage: '',
        expiry_date: '',
        max_uses: '',
      });
      setShowForm(false);
      fetchCoupons();
      alert('Coupon created successfully!');
    } catch (error: any) {
      console.error('Error creating coupon:', error);
      if (error.code === '23505') {
        alert('This coupon code already exists');
      } else {
        alert('Failed to create coupon');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCouponStatus = async (couponId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !currentStatus })
        .eq('id', couponId);

      if (error) throw error;

      setCoupons(coupons.map(coupon =>
        coupon.id === couponId ? { ...coupon, is_active: !currentStatus } : coupon
      ));
    } catch (error) {
      console.error('Error toggling coupon status:', error);
      alert('Failed to update coupon status');
    }
  };

  const deleteCoupon = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', couponId);

      if (error) throw error;

      setCoupons(coupons.filter(coupon => coupon.id !== couponId));
      alert('Coupon deleted successfully');
    } catch (error) {
      console.error('Error deleting coupon:', error);
      alert('Failed to delete coupon');
    }
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const isAtMaxUses = (coupon: Coupon) => {
    return coupon.current_uses >= coupon.max_uses;
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Coupon Management</h1>
            <p className="text-gray-600">Create and manage discount coupons</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {showForm ? 'Cancel' : 'Create Coupon'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Coupon</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coupon Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., SAVE20"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Percentage (1-100)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                    placeholder="20"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Uses
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    placeholder="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading coupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No coupons yet</h3>
            <p className="text-gray-600">Create your first coupon to offer discounts to customers</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {coupons.map((coupon) => {
              const expired = isExpired(coupon.expiry_date);
              const maxed = isAtMaxUses(coupon);
              const inactive = !coupon.is_active || expired || maxed;

              return (
                <div
                  key={coupon.id}
                  className={`bg-white rounded-lg shadow-md overflow-hidden ${inactive ? 'opacity-60' : ''}`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-lg font-mono font-bold text-lg">
                            {coupon.code}
                          </div>
                          {inactive && (
                            <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-600">
                              {expired ? 'Expired' : maxed ? 'Max Uses Reached' : 'Inactive'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-2xl font-bold text-green-600">
                          <Percent className="w-6 h-6" />
                          {coupon.discount_percentage}% OFF
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleCouponStatus(coupon.id, coupon.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            coupon.is_active
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-400 hover:bg-gray-50'
                          }`}
                          title={coupon.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {coupon.is_active ? (
                            <ToggleRight className="w-6 h-6" />
                          ) : (
                            <ToggleLeft className="w-6 h-6" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteCoupon(coupon.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Expires: {new Date(coupon.expiry_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>
                          Used: {coupon.current_uses} / {coupon.max_uses}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${(coupon.current_uses / coupon.max_uses) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Created: {new Date(coupon.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
