import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import { Package, Calendar, CreditCard, ArrowLeft, ShoppingBag, MapPin, User, Phone, Mail, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  products: {
    name: string;
    image_url: string;
  };
}

interface Order {
  id: string;
  order_id: string | null;
  product_name: string | null;
  total_amount: number;
  status: string;
  payment_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
  shipping_address: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  tracking_number: string | null;
  created_at: string;
  order_items: OrderItem[];
}

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            product_id,
            quantity,
            price,
            products (
              name,
              image_url
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'paid':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return Clock;
      case 'processing':
        return Package;
      case 'shipped':
        return Truck;
      case 'delivered':
        return CheckCircle;
      case 'cancelled':
        return XCircle;
      case 'paid':
        return CheckCircle;
      default:
        return Clock;
    }
  };

  const getStatusMessage = (status: string, trackingNumber: string | null) => {
    switch (status) {
      case 'pending':
        return 'Your order has been received and is awaiting confirmation.';
      case 'processing':
        return 'Your order is being prepared for shipment.';
      case 'shipped':
        return trackingNumber
          ? `Your order has been shipped. Tracking number: ${trackingNumber}`
          : 'Your order has been shipped and is on its way to you!';
      case 'delivered':
        return 'Your order has been delivered. Thank you for shopping with us!';
      case 'cancelled':
        return 'This order has been cancelled.';
      case 'paid':
        return 'Payment confirmed. Your order will be processed shortly.';
      default:
        return 'Order status update pending.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
        <div className="mb-6">
          <button
            onClick={() => navigate('/pets')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            Back to Profile
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-green-600 rounded-lg">
              <ShoppingBag className="text-white" size={24} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          </div>
          <p className="text-gray-600">Track and view all your order history</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
            <button
              onClick={() => navigate('/marketplace')}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all"
            >
              Browse Marketplace
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {order.order_id || `Order #${order.id.slice(0, 8).toUpperCase()}`}
                        </h3>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 gap-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCard className="w-4 h-4" />
                          {order.razorpay_payment_id?.slice(0, 12) || order.payment_id?.slice(0, 12) || 'N/A'}...
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">Total Amount</div>
                      <div className="text-2xl font-bold text-green-600">₹{order.total_amount}</div>
                    </div>
                  </div>

                  <div className={`mb-6 p-4 rounded-lg border-2 ${getStatusColor(order.status)}`}>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const StatusIconComponent = getStatusIcon(order.status);
                        return <StatusIconComponent className="w-6 h-6" />;
                      })()}
                      <div className="flex-1">
                        <div className="font-semibold text-lg mb-1">
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </div>
                        <div className="text-sm">
                          {getStatusMessage(order.status, order.tracking_number)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Order Items</h4>
                      <div className="space-y-3">
                        {order.order_items && order.order_items.length > 0 ? (
                          order.order_items.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 bg-gray-50 rounded-lg p-3">
                              <img
                                src={item.products?.image_url || 'https://via.placeholder.com/80'}
                                alt={item.products?.name || 'Product'}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {item.products?.name || 'Product'}
                                </p>
                                <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">₹{item.price}</p>
                                <p className="text-xs text-gray-500">per item</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">No items found</p>
                        )}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Order Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <Package className="w-4 h-4 text-gray-500 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Order ID</p>
                            <p className="text-sm font-medium text-gray-900">{order.order_id || `#${order.id.slice(0, 8).toUpperCase()}`}</p>
                          </div>
                        </div>

                        {order.razorpay_order_id && (
                          <div className="flex items-start gap-2">
                            <CreditCard className="w-4 h-4 text-gray-500 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500">Razorpay Order ID</p>
                              <p className="text-sm font-medium text-gray-900 break-all">{order.razorpay_order_id}</p>
                            </div>
                          </div>
                        )}

                        {order.razorpay_payment_id && (
                          <div className="flex items-start gap-2">
                            <CreditCard className="w-4 h-4 text-gray-500 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500">Payment ID</p>
                              <p className="text-sm font-medium text-gray-900 break-all">{order.razorpay_payment_id}</p>
                            </div>
                          </div>
                        )}

                        {order.customer_name && (
                          <div className="flex items-start gap-2">
                            <User className="w-4 h-4 text-gray-500 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500">Customer Name</p>
                              <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                            </div>
                          </div>
                        )}

                        {order.customer_email && (
                          <div className="flex items-start gap-2">
                            <Mail className="w-4 h-4 text-gray-500 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500">Email</p>
                              <p className="text-sm font-medium text-gray-900">{order.customer_email}</p>
                            </div>
                          </div>
                        )}

                        {order.customer_phone && (
                          <div className="flex items-start gap-2">
                            <Phone className="w-4 h-4 text-gray-500 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500">Phone</p>
                              <p className="text-sm font-medium text-gray-900">{order.customer_phone}</p>
                            </div>
                          </div>
                        )}

                        {order.shipping_address && (
                          <div className="flex items-start gap-2 md:col-span-2">
                            <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500">Shipping Address</p>
                              <p className="text-sm font-medium text-gray-900">{order.shipping_address}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4">Order Status Timeline</h4>
                    <div className="space-y-3">
                      <div className={`flex items-center gap-3 ${['pending', 'processing', 'shipped', 'delivered', 'paid'].includes(order.status) ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${['pending', 'processing', 'shipped', 'delivered', 'paid'].includes(order.status) ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium">Order Placed</div>
                          <div className="text-xs text-gray-500">Your order has been received</div>
                        </div>
                      </div>

                      <div className={`flex items-center gap-3 ${['processing', 'shipped', 'delivered'].includes(order.status) ? 'text-blue-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${['processing', 'shipped', 'delivered'].includes(order.status) ? 'bg-blue-100' : 'bg-gray-100'}`}>
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium">Processing</div>
                          <div className="text-xs text-gray-500">We're preparing your order</div>
                        </div>
                      </div>

                      <div className={`flex items-center gap-3 ${['shipped', 'delivered'].includes(order.status) ? 'text-purple-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${['shipped', 'delivered'].includes(order.status) ? 'bg-purple-100' : 'bg-gray-100'}`}>
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium">Shipped</div>
                          <div className="text-xs text-gray-500">Your order is on the way</div>
                        </div>
                      </div>

                      <div className={`flex items-center gap-3 ${order.status === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${order.status === 'delivered' ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium">Delivered</div>
                          <div className="text-xs text-gray-500">Order has been delivered</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
