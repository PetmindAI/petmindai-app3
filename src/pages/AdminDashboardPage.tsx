import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Calendar
} from 'lucide-react';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  deliveredOrders: number;
}

interface RecentOrder {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: Array<{
    products: {
      name: string;
    };
  }>;
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
  paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
};

export default function AdminDashboardPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

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

    fetchDashboardData();
  }, [user, isAdmin, authLoading, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          customer_name,
          customer_email,
          created_at,
          order_items (
            products (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const pendingOrders = orders?.filter(order =>
        order.status === 'pending' || order.status === 'processing' || order.status === 'paid'
      ).length || 0;
      const deliveredOrders = orders?.filter(order => order.status === 'delivered').length || 0;

      setStats({
        totalOrders,
        totalRevenue,
        pendingOrders,
        deliveredOrders,
      });

      setRecentOrders(orders?.slice(0, 10) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Header onNavigate={() => {}} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Overview of your store performance</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Orders</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <ShoppingCart className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">
                      ₹{stats.totalRevenue.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Pending Orders</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.pendingOrders}</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <Clock className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-emerald-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Delivered</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.deliveredOrders}</p>
                  </div>
                  <div className="bg-emerald-100 p-3 rounded-full">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(statusConfig).map(([status, config]) => {
                    const count = recentOrders.filter(order => order.status === status).length;
                    const percentage = recentOrders.length > 0
                      ? ((count / recentOrders.length) * 100).toFixed(1)
                      : 0;

                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <config.icon className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">{config.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-900 w-8">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => navigate('/admin/products')}
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all"
                  >
                    <Package className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-semibold">Manage Products</div>
                      <div className="text-xs opacity-90">Add or edit products</div>
                    </div>
                  </button>
                  <button
                    onClick={() => navigate('/admin/orders')}
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all"
                  >
                    <ShoppingCart className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-semibold">View All Orders</div>
                      <div className="text-xs opacity-90">Manage order status</div>
                    </div>
                  </button>
                  <button
                    onClick={() => navigate('/admin/coupons')}
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all"
                  >
                    <TrendingUp className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-semibold">Manage Coupons</div>
                      <div className="text-xs opacity-90">Create discount codes</div>
                    </div>
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all"
                  >
                    <Calendar className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-semibold">Refresh Data</div>
                      <div className="text-xs opacity-90">Update statistics</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
              </div>
              <div className="overflow-x-auto">
                {recentOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-gray-600">Orders will appear here once customers make purchases</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Products
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentOrders.map((order) => {
                        const statusInfo = getStatusConfig(order.status);
                        const StatusIcon = statusInfo.icon;

                        return (
                          <tr
                            key={order.id}
                            onClick={() => navigate('/admin/orders')}
                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-medium text-gray-900">
                                #{order.id.slice(0, 8)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{order.customer_name || 'N/A'}</div>
                              <div className="text-xs text-gray-500">{order.customer_email}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                {order.order_items[0]?.products?.name || 'N/A'}
                                {order.order_items.length > 1 && (
                                  <span className="text-gray-500"> +{order.order_items.length - 1} more</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-semibold text-gray-900">
                                ₹{Number(order.total_amount).toLocaleString('en-IN')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {statusInfo.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
