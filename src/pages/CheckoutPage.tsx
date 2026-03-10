import React, { useState } from 'react';
import { CreditCard, MapPin, User, CheckCircle, AlertCircle, Tag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface CheckoutPageProps {
  onNavigate: (page: string) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const { cart, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount_percentage: number;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const discountAmount = appliedCoupon
    ? (totalPrice * appliedCoupon.discount_percentage) / 100
    : 0;
  const finalTotal = totalPrice - discountAmount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setValidatingCoupon(true);
    setCouponError(null);

    try {
      const { data, error } = await supabase.rpc('validate_and_apply_coupon', {
        coupon_code_input: couponCode.trim(),
      });

      if (error) throw error;

      if (data && data[0]) {
        const result = data[0];
        if (result.is_valid) {
          setAppliedCoupon({
            code: couponCode.toUpperCase(),
            discount_percentage: result.discount_percentage,
          });
          setCouponError(null);
        } else {
          setCouponError(result.message || 'Invalid coupon code');
          setAppliedCoupon(null);
        }
      }
    } catch (error: any) {
      console.error('Error validating coupon:', error);
      setCouponError('Failed to validate coupon. Please try again.');
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  const handleRazorpayPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      alert('Please login to place an order');
      onNavigate('login');
      return;
    }

    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      setError('Please fill in all required fields');
      return;
    }

    setProcessing(true);

    try {
      console.log('=== Starting Razorpay Payment Process ===');

      for (const item of cart) {
        const { data: product, error: stockError } = await supabase
          .from('products')
          .select('stock_quantity, name')
          .eq('id', item.id)
          .single();

        if (stockError) throw stockError;

        if (!product || product.stock_quantity < item.quantity) {
          throw new Error(
            `Insufficient stock for ${product?.name || item.name}. Only ${product?.stock_quantity || 0} available.`
          );
        }
      }

      const shippingAddress = `${formData.name}, ${formData.phone}, ${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`;

      const orderPayload = {
        amount: finalTotal,
        currency: 'INR',
        receipt: `order_${Date.now()}`,
        notes: {
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
        },
      };

      console.log('Creating order with payload:', orderPayload);
      console.log('Amount in rupees:', finalTotal);
      console.log('Will be converted to paise:', finalTotal * 100);
      if (appliedCoupon) {
        console.log('Coupon applied:', appliedCoupon.code, '-', appliedCoupon.discount_percentage + '%');
      }

      const orderResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/razorpay-create-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderPayload),
        }
      );

      console.log('Order response status:', orderResponse.status);
      console.log('Order response ok:', orderResponse.ok);

      const responseText = await orderResponse.text();
      console.log('Order response body (raw):', responseText);

      let orderData;
      try {
        orderData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        throw new Error(`Invalid response from server: ${responseText}`);
      }

      if (!orderResponse.ok) {
        console.error('Order creation error response:', orderData);
        const errorMessage = orderData.error || orderData.details?.error?.description || 'Failed to create order';
        console.error('Error details:', orderData.details);
        throw new Error(errorMessage);
      }

      const razorpayOrder = orderData;
      console.log('Razorpay order received:', razorpayOrder);

      const razorpayKeyId = razorpayOrder.key_id;
      console.log('Razorpay Key ID from backend exists:', !!razorpayKeyId);
      console.log('Razorpay Key ID (first 10 chars):', razorpayKeyId?.substring(0, 10));
      console.log('Order ID to use:', razorpayOrder.id);
      console.log('Amount to charge:', razorpayOrder.amount);
      console.log('Currency:', razorpayOrder.currency);

      if (!razorpayKeyId) {
        throw new Error('Razorpay Key ID not returned from server');
      }

      const options = {
        key: razorpayKeyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'PetMind AI',
        description: 'Pet Products Purchase',
        order_id: razorpayOrder.id,
        handler: async function (response: any) {
          try {
            console.log('Payment successful, verifying...', response);

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              throw new Error('Session expired. Please login again.');
            }

            const verifyResponse = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/razorpay-verify-payment`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderDetails: {
                    user_id: user.id,
                    total_amount: finalTotal,
                    items: cart.map(item => ({
                      product_id: item.id,
                      quantity: item.quantity,
                      price: item.price,
                    })),
                    shipping_address: shippingAddress,
                    customer_name: formData.name,
                    customer_email: formData.email,
                    customer_phone: formData.phone,
                    coupon_code: appliedCoupon?.code || null,
                    discount_amount: discountAmount,
                  },
                }),
              }
            );

            const responseText = await verifyResponse.text();
            console.log('Verification response (raw):', responseText);

            let verifyData;
            try {
              verifyData = JSON.parse(responseText);
              console.log('Verification response (parsed):', verifyData);
            } catch (parseError) {
              console.error('Failed to parse verification response:', parseError);
              console.error('Response text:', responseText);
              throw new Error('Invalid response from payment verification server');
            }

            if (!verifyResponse.ok) {
              console.error('Verification failed with status:', verifyResponse.status);
              console.error('Error details:', verifyData);
              throw new Error(verifyData.error || verifyData.details || 'Payment verification failed');
            }

            if (verifyData.verified) {
              console.log('Payment verified successfully!');

              if (appliedCoupon) {
                console.log('Incrementing coupon usage for:', appliedCoupon.code);
                await supabase.rpc('increment_coupon_usage', {
                  coupon_code_input: appliedCoupon.code,
                });
              }

              console.log('Order complete, showing success message');
              setOrderPlaced(true);
              setProcessing(false);
              setTimeout(() => {
                clearCart();
              }, 2000);
            } else {
              throw new Error(verifyData.error || 'Payment verification failed');
            }
          } catch (error: any) {
            console.error('Payment verification error:', error);
            setError(error.message || 'Payment verification failed. Your payment was processed but order confirmation failed. Please contact support with your payment ID.');
            setProcessing(false);
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        notes: {
          address: shippingAddress,
        },
        theme: {
          color: '#f59e0b',
        },
        modal: {
          ondismiss: function() {
            setError('Payment was cancelled. Please try again.');
            setProcessing(false);
          }
        }
      };

      console.log('Initializing Razorpay with options:', {
        key: razorpayKeyId.substring(0, 10) + '...',
        amount: options.amount,
        currency: options.currency,
        order_id: options.order_id,
        name: options.name
      });

      let razorpay;
      try {
        razorpay = new window.Razorpay(options);
        console.log('Razorpay instance created successfully');
      } catch (initError: any) {
        console.error('Failed to initialize Razorpay:', initError);
        throw new Error(`Razorpay initialization failed: ${initError.message}`);
      }

      razorpay.on('payment.failed', function (response: any) {
        console.error('Razorpay payment failed event:', response);
        setError(`Payment failed: ${response.error.description || response.error.reason || 'Unknown error'}`);
        setProcessing(false);
      });

      console.log('Opening Razorpay checkout...');
      razorpay.open();
    } catch (error: any) {
      console.error('Error initiating payment:', error);
      setError(error.message || 'Failed to initiate payment. Please try again.');
      setProcessing(false);
    }
  };

  if (cart.length === 0 && !orderPlaced) {
    onNavigate('marketplace');
    return null;
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 pt-16 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle size={48} className="text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Payment Successful!
            </h1>
            <p className="text-gray-600 mb-8">
              Thank you for your purchase. Your order has been confirmed and will be delivered soon.
              We've sent a confirmation email to {formData.email}
            </p>
            <button
              onClick={() => {
                setOrderPlaced(false);
                onNavigate('home');
              }}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-3 rounded-full font-bold hover:from-amber-600 hover:to-orange-600 transition-all"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-16">
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Checkout</h1>
          <p className="text-lg opacity-90">Complete your order</p>
        </div>
      </div>

      <form onSubmit={handleRazorpayPayment} className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-500" size={24} />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <User size={20} className="text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Contact Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    pattern="[0-9]{10}"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <MapPin size={20} className="text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Delivery Address
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      required
                      pattern="[0-9]{6}"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CreditCard size={20} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Payment Method
                </h2>
              </div>

              <div className="flex items-center gap-3 p-4 border-2 border-amber-300 bg-amber-50 rounded-xl">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg"
                  alt="Razorpay"
                  className="h-8"
                />
                <div className="flex-1">
                  <div className="font-bold text-gray-800 mb-1">Secure Payment via Razorpay</div>
                  <p className="text-xs text-gray-600">UPI, Cards, Net Banking, Wallets</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-800">
                        {item.name}
                      </h4>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      <p className="text-sm font-bold text-amber-600">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-800">Have a coupon?</h3>
                </div>
                {appliedCoupon ? (
                  <div className="bg-green-50 border-2 border-green-500 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-green-800">{appliedCoupon.code}</div>
                        <div className="text-sm text-green-700">
                          {appliedCoupon.discount_percentage}% discount applied
                        </div>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={applyCoupon}
                        disabled={validatingCoupon || !couponCode.trim()}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {validatingCoupon ? 'Checking...' : 'Apply'}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-red-600 text-sm mt-2">{couponError}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-2 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedCoupon.discount_percentage}%)</span>
                    <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-800 pt-2 border-t">
                  <span>Total</span>
                  <span className="text-amber-600">
                    ₹{finalTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : 'Pay with Razorpay'}
              </button>

              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800 text-center">
                  Your payment information is secure and encrypted
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
