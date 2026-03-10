import React from 'react';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

interface CartPageProps {
  onNavigate: (page: string) => void;
}

const CartPage: React.FC<CartPageProps> = ({ onNavigate }) => {
  const { cart, removeFromCart, updateQuantity, totalPrice } = useCart();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 pt-16">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-2">Shopping Cart</h1>
            <p className="text-lg opacity-90">Your selected items</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-200 rounded-full mb-6">
              <ShoppingBag size={48} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-8">
              Add some amazing products for your pet!
            </p>
            <button
              onClick={() => onNavigate('marketplace')}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-3 rounded-full font-bold hover:from-amber-600 hover:to-orange-600 transition-all"
            >
              Browse Marketplace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-16">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Shopping Cart</h1>
          <p className="text-lg opacity-90">{cart.length} items in your cart</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                <div className="flex gap-4 p-4">
                  <div className="flex-shrink-0 w-24 h-24 bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-500">{item.category}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="font-bold text-lg w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.stock}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          ₹{item.price.toLocaleString('en-IN')} each
                        </p>
                        <p className="text-xl font-bold text-amber-600">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    {item.quantity >= item.stock && (
                      <p className="text-xs text-red-500 mt-2">
                        Maximum available quantity reached
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-800">
                    <span>Total</span>
                    <span className="text-amber-600">
                      ₹{totalPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate('checkout')}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2"
              >
                Proceed to Checkout
                <ArrowRight size={20} />
              </button>

              <button
                onClick={() => onNavigate('marketplace')}
                className="w-full mt-3 border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all"
              >
                Continue Shopping
              </button>

              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 font-medium">
                  Free shipping on all orders!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
