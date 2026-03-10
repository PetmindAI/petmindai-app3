import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit2, Trash2, Save, X, ShieldAlert, Package, Stethoscope } from 'lucide-react';
import { supabase, Product } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AdminPageProps {
  onNavigate: (page: string) => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Dog Food',
    price: '',
    description: '',
    image_url: '',
    stock: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      description: formData.description,
      image_url: formData.image_url,
      stock: parseInt(formData.stock),
    };

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) {
          if (error.code === 'PGRST301' || error.message.includes('row-level security')) {
            alert('Access denied. Admin privileges required to modify products.');
            return;
          }
          throw error;
        }
      } else {
        const { error } = await supabase.from('products').insert([productData]);

        if (error) {
          if (error.code === 'PGRST301' || error.message.includes('row-level security')) {
            alert('Access denied. Admin privileges required to add products.');
            return;
          }
          throw error;
        }
      }

      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product. Please try again.');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      description: product.description,
      image_url: product.image_url,
      stock: product.stock.toString(),
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);

      if (error) {
        if (error.code === 'PGRST301' || error.message.includes('row-level security')) {
          alert('Access denied. Admin privileges required to delete products.');
          return;
        }
        throw error;
      }
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error deleting product. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Dog Food',
      price: '',
      description: '',
      image_url: '',
      stock: '',
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <ShieldAlert className="text-red-600" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            You must be logged in to access the admin panel.
          </p>
          <button
            onClick={() => onNavigate('login')}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4 rounded-lg font-bold hover:from-amber-600 hover:to-orange-600 transition-all"
          >
            Go to Login
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="w-full mt-3 border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <ShieldAlert className="text-red-600" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access the admin panel. Only users with admin privileges can manage products.
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4 rounded-lg font-bold hover:from-amber-600 hover:to-orange-600 transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-16">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
              <p className="text-lg opacity-90">Manage your products and orders</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition-all flex items-center gap-2"
            >
              <Plus size={20} />
              Add Product
            </button>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate('/admin/orders')}
              className="bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-medium hover:bg-white/20 transition-all flex items-center gap-2 border border-white/20"
            >
              <Package size={20} />
              View Orders
            </button>
            <button
              onClick={() => navigate('/admin/vets')}
              className="bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-medium hover:bg-white/20 transition-all flex items-center gap-2 border border-white/20"
            >
              <Stethoscope size={20} />
              Manage Vets
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
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
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
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Dog Food">Dog Food</option>
                    <option value="Cat Food">Cat Food</option>
                    <option value="Pet Toys">Pet Toys</option>
                    <option value="Grooming">Grooming</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock *
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL *
                  </label>
                  <input
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    {editingProduct ? 'Update Product' : 'Add Product'}
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

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                      Stock
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div>
                            <p className="font-medium text-gray-800">
                              {product.name}
                            </p>
                            <p className="text-sm text-gray-500 line-clamp-1">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-800">
                        ₹{product.price.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`font-medium ${
                            product.stock > 20
                              ? 'text-green-600'
                              : product.stock > 0
                              ? 'text-amber-600'
                              : 'text-red-600'
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {products.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No products found.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700"
                >
                  Add Your First Product
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
