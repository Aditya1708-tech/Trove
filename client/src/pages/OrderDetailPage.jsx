import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle, Clock, XCircle, MapPin, Download, Phone } from 'lucide-react';
import { orderAPI } from '../api';

const STATUS_STEPS = [
  { key: 'pending',    label: 'Order Placed',   icon: Package },
  { key: 'confirmed',  label: 'Confirmed',       icon: CheckCircle },
  { key: 'processing', label: 'Processing',      icon: Clock },
  { key: 'shipped',    label: 'Shipped',         icon: Truck },
  { key: 'delivered',  label: 'Delivered',       icon: CheckCircle },
];

function StatusBadge({ status }) {
  const config = {
    pending:    { cls: 'badge-primary',  label: 'Pending' },
    confirmed:  { cls: 'badge-success',  label: 'Confirmed' },
    processing: { cls: 'badge-amber',    label: 'Processing' },
    shipped:    { cls: 'badge bg-blue-100 text-blue-700', label: 'Shipped' },
    delivered:  { cls: 'badge-success',  label: 'Delivered' },
    cancelled:  { cls: 'badge-error',    label: 'Cancelled' },
    returned:   { cls: 'badge bg-orange-100 text-orange-700', label: 'Returned' },
  };
  const c = config[status] || { cls: 'badge-primary', label: status };
  return <span className={c.cls}>{c.label}</span>;
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    document.title = 'Order Details — Trove';
    orderAPI.getOrderById(id)
      .then(({ data }) => setOrder(data.data.order))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      const { data } = await orderAPI.cancelOrder(id, 'Changed my mind');
      setOrder(data.data.order);
    } catch (err) {
      alert(err.response?.data?.message || 'Cancellation failed');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
        {[1,2,3].map((i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <span className="text-5xl mb-4">📦</span>
        <h2 className="font-heading text-2xl font-bold">Order not found</h2>
        <Link to="/orders" className="btn-primary mt-6">My Orders</Link>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order.orderStatus);
  const isCancelled = order.orderStatus === 'cancelled';
  const canCancel   = ['pending', 'confirmed', 'processing'].includes(order.orderStatus);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">Order Details</h1>
          <p className="text-sm text-gray-400 mt-0.5">#{order._id?.slice(-8).toUpperCase()}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge status={order.orderStatus} />
          <StatusBadge status={order.paymentStatus} />
        </div>
      </div>

      {/* Tracking timeline */}
      {!isCancelled && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-6 text-sm uppercase tracking-wide">
            Order Tracking
          </h3>
          <div className="relative">
            {/* Progress line */}
            <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100 dark:bg-gray-800" />
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
              className="absolute left-4 top-4 w-0.5 bg-primary-500"
              style={{ originY: 0 }}
            />

            <div className="space-y-6">
              {STATUS_STEPS.map((step, i) => {
                const isDone    = i < currentStepIndex;
                const isCurrent = i === currentStepIndex;
                const Icon      = step.icon;
                const histEntry = order.statusHistory?.find((h) => h.status === step.key);

                return (
                  <div key={step.key} className="flex items-start gap-4 relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                      isDone    ? 'bg-green-500 text-white shadow-md' :
                      isCurrent ? 'bg-primary-500 text-white shadow-glow ring-4 ring-primary-200' :
                      'bg-gray-100 dark:bg-dark-800 text-gray-300'
                    }`}>
                      <Icon size={15} />
                    </div>
                    <div className={`pb-2 ${isCurrent ? 'font-semibold' : ''}`}>
                      <p className={`text-sm font-medium ${isDone || isCurrent ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                        {step.label}
                        {isCurrent && (
                          <span className="ml-2 inline-block w-2 h-2 rounded-full bg-primary-500 animate-pulse-slow" />
                        )}
                      </p>
                      {histEntry && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {histEntry.message} •{' '}
                          {new Date(histEntry.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                      {step.key === 'shipped' && order.trackingNumber && (
                        <p className="text-xs text-primary-600 mt-1 font-medium">
                          Tracking: {order.trackingNumber} via {order.shippingProvider}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {order.estimatedDelivery && !['delivered','cancelled'].includes(order.orderStatus) && (
            <div className="mt-4 bg-primary-50 dark:bg-primary-950/20 rounded-xl p-3 text-sm text-primary-700 dark:text-primary-300 font-medium">
              📅 Estimated delivery by{' '}
              {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long' })}
            </div>
          )}
        </div>
      )}

      {/* Items */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wide">
          Items ({order.items?.length})
        </h3>
        <div className="space-y-4">
          {order.items?.map((item) => (
            <div key={item._id} className="flex gap-4">
              <img
                src={item.product?.images?.[0]?.url || 'https://placehold.co/60x60'}
                alt={item.product?.name}
                className="w-16 h-16 rounded-xl object-contain bg-gray-50 border border-gray-100"
              />
              <div className="flex-1">
                <Link to={`/product/${item.product?.slug}`} className="text-sm font-medium text-gray-800 dark:text-gray-200 hover:text-primary-600 line-clamp-2">
                  {item.product?.name}
                </Link>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                  {item.variant?.color   && <span>{item.variant.color}</span>}
                  {item.variant?.size    && <span>• {item.variant.size}</span>}
                  {item.variant?.storage && <span>• {item.variant.storage}</span>}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm text-gray-900 dark:text-white">₹{(item.price * item.quantity).toLocaleString()}</p>
                <p className="text-xs text-gray-400">₹{item.price.toLocaleString()} each</p>
              </div>
            </div>
          ))}
        </div>

        {/* Price summary */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2 text-sm">
          {[
            { label: 'Items Total', val: `₹${order.itemsTotal?.toLocaleString()}` },
            { label: 'Savings', val: `−₹${order.savings?.toLocaleString()}`, cls: 'text-green-600' },
            ...(order.discountAmount > 0 ? [{ label: `Coupon (${order.appliedCoupon?.code})`, val: `−₹${order.discountAmount?.toLocaleString()}`, cls: 'text-green-600' }] : []),
            { label: 'Delivery', val: order.shippingCharges === 0 ? 'FREE' : `₹${order.shippingCharges}` },
          ].map(({ label, val, cls }) => (
            <div key={label} className="flex justify-between text-gray-500">
              <span>{label}</span>
              <span className={cls}>{val}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-gray-900 dark:text-white border-t border-gray-100 dark:border-gray-800 pt-2">
            <span>Total Paid</span>
            <span>₹{order.total?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Delivery address */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
          <MapPin size={15} className="text-primary-500" /> Delivery Address
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-0.5">
          <p className="font-semibold text-gray-900 dark:text-white">{order.shippingAddress?.fullName}</p>
          <p>{order.shippingAddress?.addressLine1}{order.shippingAddress?.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}</p>
          <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode}</p>
          <p className="flex items-center gap-1 mt-1"><Phone size={12} /> {order.shippingAddress?.phone}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="btn-danger flex items-center gap-2"
          >
            <XCircle size={16} />
            {cancelling ? 'Cancelling...' : 'Cancel Order'}
          </button>
        )}
        {order.orderStatus === 'delivered' && (
          <button className="btn-outline flex items-center gap-2">
            <Download size={16} /> Download Invoice
          </button>
        )}
        <Link to="/orders" className="btn-ghost">← All Orders</Link>
      </div>

      {/* Refund info */}
      {order.paymentStatus === 'refunded' && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 text-sm text-blue-700 dark:text-blue-300">
          <p className="font-semibold">Refund Processed</p>
          <p className="mt-1 text-blue-600">₹{order.refundAmount?.toLocaleString()} will be credited to your original payment method within 5-7 business days.</p>
        </div>
      )}
    </div>
  );
}
