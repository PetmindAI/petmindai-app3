import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import AdminProductForm from '../components/AdminProductForm';
import { Plus, CreditCard as Edit2, Trash2, Package, Calendar } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image_url: string;
  stock: number;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export default function AdminProductsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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

    fetchProducts();
  }, [user, isAdmin, authLoading, navigate]);

  const fetchProducts = async () => {
    try {
      setLoading(true);

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

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

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

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProduct(null);
    fetchProducts();
  };

  const getStockColor = (stock: number) => {
    if (stock === 0) return 'text-red-600 bg-red-50';
    if (stock < 10) return 'text-amber-600 bg-amber-50';
    if (stock < 50) return 'text-blue-600 bg-blue-50';
    return 'text-green-600 bg-green-50';
  };

  const getStockLabel = (stock: number) => {
    if (stock === 0) return 'Out of Stock';
    if (stock < 10) return 'Low Stock';
    return 'In Stock';
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Header onNavigate={() => {}} />

      <div className="max-w-7xl mx-auto px-4 py-8 pb-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Management</h1>
            <p className="text-gray-600">Add, edit, and manage your product catalog</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Plus size={20} />
            Add New Product
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products yet</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first product</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all"
            >
              Add Your First Product
            </button>
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
                      Created
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-20 h-20 object-cover rounded-lg shadow-sm"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 mb-1">
                              {product.name}
                            </p>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900 text-lg">
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStockColor(product.stock_quantity)}`}>
                            {product.stock_quantity} units
                          </span>
                          <span className="text-xs text-gray-500">
                            {getStockLabel(product.stock)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(product.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit product"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete product"
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

            <div className="bg-gray-50 px-6 py-4 border-t">
              <p className="text-sm text-gray-600">
                Total Products: <span className="font-semibold text-gray-900">{products.length}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <AdminProductForm
          product={editingProduct}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
