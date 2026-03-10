import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Phone, Mail, Clock, Award, DollarSign, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Vet {
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
}

interface Review {
  id: string;
  rating: number;
  review_text: string;
  created_at: string;
  user_id: string;
  user_profiles?: {
    full_name: string;
  };
}

export default function VetProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vet, setVet] = useState<Vet | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchVetDetails();
      fetchReviews();
    }
  }, [id]);

  const fetchVetDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('vets')
        .select('*')
        .eq('id', id)
        .eq('is_approved', true)
        .single();

      if (error) throw error;
      setVet(data);
    } catch (error) {
      console.error('Error fetching vet details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('vet_reviews')
        .select(`
          *,
          user_profiles:user_id (full_name)
        `)
        .eq('vet_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to submit a review');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('vet_reviews')
        .insert({
          vet_id: id,
          user_id: user.id,
          rating,
          review_text: reviewText,
        });

      if (error) throw error;

      setReviewText('');
      setRating(5);
      setShowReviewForm(false);
      fetchReviews();
      fetchVetDetails();
      alert('Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pt-20 pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-pulse">Loading veterinarian details...</div>
        </div>
      </div>
    );
  }

  if (!vet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pt-20 pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xl text-gray-600">Veterinarian not found</p>
          <button
            onClick={() => navigate('/vets')}
            className="mt-4 text-green-600 hover:text-green-700 font-semibold"
          >
            Back to Veterinarians
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pt-20 pb-24 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/vets')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Veterinarians
        </button>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-green-400 to-blue-500 h-40 flex items-center justify-center">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-5xl font-bold text-green-600">
                {vet.vet_name.charAt(0)}
              </span>
            </div>
          </div>

          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{vet.vet_name}</h1>
              <p className="text-xl text-green-600 font-semibold mb-4">{vet.clinic_name}</p>

              <div className="flex items-center justify-center gap-2 mb-4">
                <Star className="w-6 h-6 text-yellow-500 fill-current" />
                <span className="text-2xl font-bold text-gray-900">{vet.rating.toFixed(1)}</span>
                <span className="text-gray-600">({vet.total_reviews} reviews)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Specialization</p>
                    <p className="font-semibold text-gray-900">{vet.specialization}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Experience</p>
                    <p className="font-semibold text-gray-900">{vet.experience_years} years</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Consultation Fee</p>
                    <p className="font-semibold text-green-600">₹{vet.consultation_fee}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-semibold text-gray-900">{vet.address}</p>
                    <p className="text-gray-600">{vet.city}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <a href={`tel:${vet.phone}`} className="font-semibold text-green-600 hover:text-green-700">
                      {vet.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <a href={`mailto:${vet.email}`} className="font-semibold text-green-600 hover:text-green-700">
                      {vet.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Availability</p>
                  <p className="font-semibold text-gray-900">{vet.availability}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <a
                href={`tel:${vet.phone}`}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-all text-center"
              >
                Call Now
              </a>
              <a
                href={`mailto:${vet.email}`}
                className="flex-1 bg-white border-2 border-green-500 text-green-600 py-3 rounded-lg font-semibold hover:bg-green-50 transition-all text-center"
              >
                Send Email
              </a>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
            {user && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition-all"
              >
                {showReviewForm ? 'Cancel' : 'Write Review'}
              </button>
            )}
          </div>

          {showReviewForm && (
            <form onSubmit={handleSubmitReview} className="mb-8 bg-gray-50 rounded-lg p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Share your experience..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}

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

            {reviews.length === 0 && (
              <p className="text-center text-gray-600 py-8">No reviews yet. Be the first to review!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
