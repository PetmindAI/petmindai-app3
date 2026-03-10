import { useEffect, useState } from 'react';
import { MapPin, Star, Phone, Mail, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

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
}

export default function VetsPage() {
  const [vets, setVets] = useState<Vet[]>([]);
  const [filteredVets, setFilteredVets] = useState<Vet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState('all');
  const [minRating, setMinRating] = useState(0);
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    fetchVets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedCity, minRating, vets]);

  const fetchVets = async () => {
    try {
      const { data, error } = await supabase
        .from('vets')
        .select('*')
        .eq('is_approved', true)
        .order('rating', { ascending: false });

      if (error) throw error;

      setVets(data || []);

      const uniqueCities = [...new Set(data?.map(v => v.city) || [])];
      setCities(uniqueCities);
    } catch (error) {
      console.error('Error fetching vets:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...vets];

    if (selectedCity !== 'all') {
      filtered = filtered.filter(vet => vet.city === selectedCity);
    }

    if (minRating > 0) {
      filtered = filtered.filter(vet => vet.rating >= minRating);
    }

    setFilteredVets(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pt-20 pb-24 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-pulse">Loading veterinarians...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pt-20 pb-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Find a Veterinarian</h1>
          <p className="text-xl text-gray-600">Connect with experienced veterinarians near you</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filter Veterinarians</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Cities</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value={0}>All Ratings</option>
                <option value={4.5}>4.5+ Stars</option>
                <option value={4.0}>4.0+ Stars</option>
                <option value={3.5}>3.5+ Stars</option>
                <option value={3.0}>3.0+ Stars</option>
              </select>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredVets.length} of {vets.length} veterinarians
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVets.map(vet => (
            <Link
              key={vet.id}
              to={`/vet/${vet.id}`}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="bg-gradient-to-r from-green-400 to-blue-500 h-32 flex items-center justify-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-green-600">
                    {vet.vet_name.charAt(0)}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1">{vet.vet_name}</h3>
                <p className="text-green-600 font-semibold mb-3">{vet.clinic_name}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm text-gray-600">
                      {vet.rating.toFixed(1)} ({vet.total_reviews} reviews)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{vet.city}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Specialization</span>
                    <span className="text-sm font-semibold text-gray-900">{vet.specialization}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Experience</span>
                    <span className="text-sm font-semibold text-gray-900">{vet.experience_years} years</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Consultation Fee</span>
                    <span className="text-sm font-semibold text-green-600">₹{vet.consultation_fee}</span>
                  </div>
                </div>

                <button className="mt-6 w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-all">
                  View Profile
                </button>
              </div>
            </Link>
          ))}
        </div>

        {filteredVets.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600">No veterinarians found matching your criteria.</p>
            <button
              onClick={() => {
                setSelectedCity('all');
                setMinRating(0);
              }}
              className="mt-4 text-green-600 hover:text-green-700 font-semibold"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
