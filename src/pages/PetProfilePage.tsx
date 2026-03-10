import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit2, Trash2, X, PawPrint, ShoppingBag } from 'lucide-react';
import { supabase, Pet } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const PetProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    pet_type: 'dog' as 'dog' | 'cat',
    breed: '',
    age: '',
    image_url: '',
  });

  useEffect(() => {
    if (user) {
      fetchPets();
    }
  }, [user]);

  const fetchPets = async () => {
    try {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPets(data || []);
    } catch (error) {
      console.error('Error fetching pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Please login to manage pets');
      return;
    }

    const petData = {
      user_id: user.id,
      name: formData.name,
      pet_type: formData.pet_type,
      breed: formData.breed || null,
      age: formData.age ? parseInt(formData.age) : null,
      image_url: formData.image_url || null,
    };

    try {
      if (editingPet) {
        const { error } = await supabase
          .from('pets')
          .update(petData)
          .eq('id', editingPet.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('pets').insert([petData]);

        if (error) throw error;
      }

      resetForm();
      fetchPets();
    } catch (error) {
      console.error('Error saving pet:', error);
      alert('Error saving pet. Please try again.');
    }
  };

  const handleEdit = (pet: Pet) => {
    setEditingPet(pet);
    setFormData({
      name: pet.name,
      pet_type: pet.pet_type,
      breed: pet.breed || '',
      age: pet.age?.toString() || '',
      image_url: pet.image_url || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this pet?')) return;

    try {
      const { error } = await supabase.from('pets').delete().eq('id', id);

      if (error) throw error;
      fetchPets();
    } catch (error) {
      console.error('Error deleting pet:', error);
      alert('Error deleting pet. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      pet_type: 'dog',
      breed: '',
      age: '',
      image_url: '',
    });
    setEditingPet(null);
    setShowForm(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pb-20 pt-16">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-6">
            <PawPrint className="text-amber-600" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Login Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please login to manage your pet profiles
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-16">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">My Pets</h1>
              <p className="text-lg opacity-90">Manage your furry friends</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-white text-amber-600 px-6 py-3 rounded-lg font-bold hover:bg-amber-50 transition-all flex items-center gap-2"
            >
              <Plus size={20} />
              Add Pet
            </button>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate('/orders')}
              className="bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-medium hover:bg-white/20 transition-all flex items-center gap-2 border border-white/20"
            >
              <ShoppingBag size={20} />
              My Orders
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingPet ? 'Edit Pet' : 'Add New Pet'}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pet Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pet Type *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center justify-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-amber-300 transition-colors">
                      <input
                        type="radio"
                        value="dog"
                        checked={formData.pet_type === 'dog'}
                        onChange={(e) => setFormData({ ...formData, pet_type: e.target.value as 'dog' })}
                        className="w-4 h-4 text-amber-500"
                      />
                      <span className="font-medium text-gray-800">Dog</span>
                    </label>
                    <label className="flex items-center justify-center gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-amber-300 transition-colors">
                      <input
                        type="radio"
                        value="cat"
                        checked={formData.pet_type === 'cat'}
                        onChange={(e) => setFormData({ ...formData, pet_type: e.target.value as 'cat' })}
                        className="w-4 h-4 text-amber-500"
                      />
                      <span className="font-medium text-gray-800">Cat</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Breed
                    </label>
                    <input
                      type="text"
                      value={formData.breed}
                      onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                      placeholder="e.g., Golden Retriever"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age (years)
                    </label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      min="0"
                      max="50"
                      placeholder="e.g., 3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photo URL
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://images.pexels.com/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                  {formData.image_url && (
                    <div className="mt-2">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-lg font-bold hover:from-amber-600 hover:to-orange-600 transition-all"
                  >
                    {editingPet ? 'Update Pet' : 'Add Pet'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {pets.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-100 rounded-full mb-6">
              <PawPrint className="text-amber-600" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No Pets Added Yet</h2>
            <p className="text-gray-600 mb-6">
              Add your first pet to get started!
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-lg font-bold hover:from-amber-600 hover:to-orange-600 transition-all"
            >
              Add Your First Pet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet) => (
              <div
                key={pet.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative h-48 bg-gradient-to-br from-amber-100 to-orange-100">
                  {pet.image_url ? (
                    <img
                      src={pet.image_url}
                      alt={pet.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PawPrint className="text-amber-400" size={64} />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-bold uppercase">
                    {pet.pet_type}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {pet.name}
                  </h3>
                  {pet.breed && (
                    <p className="text-gray-600 mb-1">
                      <span className="font-medium">Breed:</span> {pet.breed}
                    </p>
                  )}
                  {pet.age !== null && pet.age !== undefined && (
                    <p className="text-gray-600 mb-4">
                      <span className="font-medium">Age:</span> {pet.age} {pet.age === 1 ? 'year' : 'years'}
                    </p>
                  )}

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleEdit(pet)}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(pet.id)}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PetProfilePage;
