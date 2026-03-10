import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Check, X, CreditCard as Edit2, Trash2, Star } from 'lucide-react';

interface Vet {
  id: string;
  vet_name: string;
  clinic_name: string;
  specialization: string;
  experience_years: number;
  city: string;
  rating: number;
  total_reviews: number;
  consultation_fee: number;
  phone: string;
  email: string;
  is_approved: boolean;
  created_at: string;
}

export default function AdminVetsPage() {
  const [vets, setVets] = useState<Vet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');

  useEffect(() => {
    fetchVets();
  }, []);

  const fetchVets = async () => {
    try {
      const { data, error } = await supabase
        .from('vets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVets(data || []);
    } catch (error) {
      console.error('Error fetching vets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vets')
        .update({ is_approved: true })
        .eq('id', id);

      if (error) throw error;
      fetchVets();
      alert('Vet approved successfully!');
    } catch (error) {
      console.error('Error approving vet:', error);
      alert('Failed to approve vet');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vets')
        .update({ is_approved: false })
        .eq('id', id);

      if (error) throw error;
      fetchVets();
      alert('Vet approval revoked!');
    } catch (error) {
      console.error('Error rejecting vet:', error);
      alert('Failed to reject vet');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vet? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('vets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchVets();
      alert('Vet deleted successfully!');
    } catch (error) {
      console.error('Error deleting vet:', error);
      alert('Failed to delete vet');
    }
  };

  const filteredVets = vets.filter(vet => {
    if (filter === 'approved') return vet.is_approved;
    if (filter === 'pending') return !vet.is_approved;
    return true;
  });

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">Loading vets...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Manage Veterinarians</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'all'
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All ({vets.length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'approved'
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Approved ({vets.filter(v => v.is_approved).length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'pending'
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pending ({vets.filter(v => !v.is_approved).length})
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredVets.map(vet => (
          <div key={vet.id} className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{vet.vet_name}</h3>
                  {vet.is_approved ? (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                      Approved
                    </span>
                  ) : (
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
                      Pending
                    </span>
                  )}
                </div>
                <p className="text-green-600 font-semibold mb-2">{vet.clinic_name}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Specialization</p>
                    <p className="font-semibold text-gray-900">{vet.specialization || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Experience</p>
                    <p className="font-semibold text-gray-900">{vet.experience_years} years</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">City</p>
                    <p className="font-semibold text-gray-900">{vet.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fee</p>
                    <p className="font-semibold text-green-600">₹{vet.consultation_fee}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm text-gray-600">
                      {vet.rating.toFixed(1)} ({vet.total_reviews} reviews)
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Phone: {vet.phone}
                  </div>
                  <div className="text-sm text-gray-600">
                    Email: {vet.email}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {!vet.is_approved ? (
                  <button
                    onClick={() => handleApprove(vet.id)}
                    className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition-all"
                    title="Approve"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleReject(vet.id)}
                    className="bg-yellow-500 text-white p-2 rounded-lg hover:bg-yellow-600 transition-all"
                    title="Revoke Approval"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(vet.id)}
                  className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-all"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredVets.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No veterinarians found</p>
          </div>
        )}
      </div>
    </div>
  );
}
