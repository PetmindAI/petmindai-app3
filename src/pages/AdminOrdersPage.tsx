import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import { Package, Calendar, Mail, Phone, MapPin, CreditCard, Clock, CheckCircle, Truck, XCircle, RefreshCw } from 'lucide-react';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  products: {
    name: string;
  };
}

interface Order {
  id: string;
  order_id: string | null;
  product_name: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  total_amount: number;
  status: string;
  payment_id: string | null;
  razorpay_payment_id: string | null;
  shipping_address: string | null;
  tracking_number: string | null;
  created_at: string;
  order_items: OrderItem[];
}

export default function AdminOrdersPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [trackingNumbers, setTrackingNumbers] = useState<Record<string, string>>({});

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

    fetchOrders();
  }, [user, isAdmin, authLoading, navigate]);

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
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrderId(orderId);

      const updateData: { status: string; tracking_number?: string } = { status: newStatus };

      if (newStatus === 'shipped') {
        const trackingNumber = trackingNumbers[orderId];
        if (!trackingNumber || trackingNumber.trim() === '') {
          alert('Please enter a tracking number before marking as shipped');
          setUpdatingOrderId(null);
          return;
        }
        updateData.tracking_number = trackingNumber.trim();
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, ...updateData } : order
      ));

      if (['processing', 'shipped', 'delivered'].includes(newStatus)) {
        alert(`Order status updated to ${newStatus}. Email notification will be sent to the customer.`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const updateTrackingNumber = async (orderId: string) => {
    const trackingNumber = trackingNumbers[orderId];
    if (!trackingNumber || trackingNumber.trim() === '') {
      alert('Please enter a tracking number');
      return;
    }

    try {
      setUpdatingOrderId(orderId);
      const { error } = await supabase
        .from('orders')
        .update({ tracking_number: trackingNumber.trim() })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, tracking_number: trackingNumber.trim() } : order
      ));

      alert('Tracking number updated successfully');
    } catch (error) {
      console.error('Error updating tracking number:', error);
      alert('Failed to update tracking number');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'paid':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return Clock;
      case 'processing':
        return RefreshCw;
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

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders Dashboard</h1>
          <p className="text-gray-600">Manage and track all customer orders</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600">Orders will appear here once customers make purchases</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {order.order_id || `Order #${order.id.slice(0, 8)}`}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(order.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const StatusIconComponent = getStatusIcon(order.status);
                        return (
                          <span className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(order.status)}`}>
                            <StatusIconComponent className="w-4 h-4" />
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        );
                      })()}
                      <div className="flex items-center gap-2">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          disabled={updatingOrderId === order.id}
                          className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white hover:border-gray-400 transition-colors"
                        >
                          <option value="paid">Paid</option>
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        {updatingOrderId === order.id && (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start">
                          <span className="font-medium text-gray-700 w-24">Name:</span>
                          <span className="text-gray-900">{order.customer_name || 'N/A'}</span>
                        </div>
                        <div className="flex items-start">
                          <Mail className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                          <span className="text-gray-900">{order.customer_email || 'N/A'}</span>
                        </div>
                        <div className="flex items-start">
                          <Phone className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                          <span className="text-gray-900">{order.customer_phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-start">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                          <span className="text-gray-900">{order.shipping_address || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Payment Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start">
                          <span className="font-medium text-gray-700 w-32">Total Amount:</span>
                          <span className="text-green-600 font-semibold text-lg">₹{order.total_amount}</span>
                        </div>
                        <div className="flex items-start">
                          <CreditCard className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                          <div>
                            <div className="text-gray-900">
                              {order.razorpay_payment_id || order.payment_id || 'N/A'}
                            </div>
                            {order.razorpay_payment_id && (
                              <div className="text-xs text-gray-500 mt-1">Razorpay Payment</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      {order.order_items && order.order_items.length > 0 ? (
                        <div className="space-y-2">
                          {order.order_items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center">
                              <div>
                                <span className="font-medium text-gray-900">
                                  {item.products?.name || 'Product'}
                                </span>
                                <span className="text-gray-600 ml-2">× {item.quantity}</span>
                              </div>
                              <span className="text-gray-900 font-medium">₹{item.price}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No items found</p>
                      )}
                    </div>
                  </div>

                  {(order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered') && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        Shipping Tracking
                      </h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter tracking number"
                          value={trackingNumbers[order.id] || order.tracking_number || ''}
                          onChange={(e) => setTrackingNumbers({ ...trackingNumbers, [order.id]: e.target.value })}
                          className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                        <button
                          onClick={() => updateTrackingNumber(order.id)}
                          disabled={updatingOrderId === order.id}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                          Update
                        </button>
                      </div>
                      {order.tracking_number && (
                        <div className="mt-2 text-sm text-gray-600">
                          Current tracking: <span className="font-medium text-gray-900">{order.tracking_number}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
