import React, { useState, useEffect } from 'react';
import { ShoppingCart, Filter } from 'lucide-react';
import { supabase, Product } from '../lib/supabase';
import { useCart } from '../contexts/CartContext';

const MarketplacePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const { addToCart } = useCart();
  const [addedToCart, setAddedToCart] = useState<string | null>(null);

  const categories = ['All', 'Dog Food', 'Cat Food', 'Pet Toys', 'Grooming', 'Accessories'];

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

  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    setAddedToCart(product.id);
    setTimeout(() => setAddedToCart(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-16">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Pet Marketplace</h1>
          <p className="text-lg opacity-90">
            Premium products for your furry friends
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <Filter size={20} className="text-gray-600 flex-shrink-0" />
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-amber-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative h-48 bg-gray-200">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    ₹{product.price.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                      {product.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      {product.stock_quantity > 0 ? (
                        <span className={product.stock_quantity <= 10 ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                          {product.stock_quantity <= 10 ? `Only ${product.stock_quantity} left!` : `${product.stock_quantity} in stock`}
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium">Out of stock</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock_quantity === 0}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        product.stock_quantity === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : addedToCart === product.id
                          ? 'bg-green-500 text-white'
                          : 'bg-amber-500 text-white hover:bg-amber-600'
                      }`}
                    >
                      <ShoppingCart size={18} />
                      {addedToCart === product.id
                        ? 'Added!'
                        : product.stock_quantity === 0
                        ? 'Out of Stock'
                        : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No products found in this category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplacePage;
