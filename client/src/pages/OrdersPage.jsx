import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, ChevronRight } from 'lucide-react';
import { orderAPI } from '../api';

const STATUS_COLOR = {
  pending:    'badge-primary',
  confirmed:  'badge-success',
  processing: 'badge-amber',
  shipped:    'badge bg-blue-100 text-blue-700',
  delivered:  'badge-success',
  cancelled:  'badge-error',
  returned:   'badge bg-orange-100 text-orange-700',
};

export default function OrdersPage() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');

  useEffect(() => {
    document.title = 'My Orders — Trove';
    orderAPI.getMyOrders({ limit: 30 })
      .then(({ data }) => setOrders(data.data.orders))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.orderStatus === filter);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6">
      <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-3">
        <Package size={26} className="text-primary-500" /> My Orders
      </h1>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3 mb-5">
        {['all','pending','confirmed','processing','shipped','delivered','cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={filter === s ? 'tab-pill-active' : 'tab-pill-inactive'}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map((i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package size={60} className="text-gray-200 dark:text-gray-700 mb-4" />
          <h3 className="font-heading text-xl font-bold text-gray-900 dark:text-white mb-2">No orders yet</h3>
          <p className="text-gray-400 mb-6">Start shopping and your orders will appear here</p>
          <Link to="/" className="btn-primary">Shop Now</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order, i) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link to={`/orders/${order._id}`} className="card-hover p-5 flex items-start gap-4 block">
                {/* Images preview */}
                <div className="flex -space-x-2">
                  {order.items?.slice(0, 3).map((item, j) => (
                    <img
                      key={j}
                      src={item.product?.images?.[0]?.url || 'https://placehold.co/50x50'}
                      alt={item.product?.name}
                      className="w-12 h-12 rounded-xl object-contain bg-gray-50 border-2 border-white dark:border-dark-800"
                    />
                  ))}
                  {order.items?.length > 3 && (
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-dark-700 border-2 border-white dark:border-dark-800 flex items-center justify-center text-xs font-bold text-gray-500">
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-xs text-gray-400">#{order._id?.slice(-8).toUpperCase()}</p>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm mt-0.5 truncate">
                        {order.items?.[0]?.product?.name}
                        {order.items?.length > 1 ? ` +${order.items.length - 1} more` : ''}
                      </p>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 flex-shrink-0 mt-1" />
                  </div>

                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={STATUS_COLOR[order.orderStatus] || 'badge-primary'}>
                      {order.orderStatus?.charAt(0).toUpperCase() + order.orderStatus?.slice(1)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="font-bold text-sm text-gray-900 dark:text-white ml-auto">
                      ₹{order.total?.toLocaleString()}
                    </span>
                  </div>

                  {order.estimatedDelivery && !['delivered','cancelled'].includes(order.orderStatus) && (
                    <p className="text-xs text-primary-600 mt-1 font-medium">
                      Expected by {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
