import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, BookmarkPlus, ShoppingBag, ArrowRight, Tag, X, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

function CartItem({ item, onUpdate, onRemove, onSaveForLater }) {
  const product = item.product;
  const variant = product?.variants?.find?.((v) => v._id?.toString() === item.variantId?.toString())
    || product?.variants?.[0];

  const price     = variant?.price || item.price || 0;
  const mrp       = variant?.mrp   || item.mrp   || 0;
  const discount  = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const image     = product?.images?.[0]?.url || `https://placehold.co/100x100/E8EDFF/4E4FEB?text=IMG`;
  const name      = product?.name || 'Product';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex gap-4 py-5 border-b border-gray-100 dark:border-gray-800 last:border-0"
    >
      {/* Image */}
      <Link to={`/product/${product?.slug}`} className="flex-shrink-0">
        <img src={image} alt={name}
          className="w-24 h-24 rounded-xl object-contain bg-gray-50 dark:bg-dark-800 border border-gray-100 dark:border-gray-700" />
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <Link to={`/product/${product?.slug}`} className="font-semibold text-gray-800 dark:text-gray-200 text-sm hover:text-primary-600 truncate-2 leading-snug block">
          {name}
        </Link>
        <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-gray-400">
          {variant?.color  && <span>Color: {variant.color}</span>}
          {variant?.size   && <span>• Size: {variant.size}</span>}
          {variant?.storage && <span>• {variant.storage}</span>}
          {item.isSavedForLater && <span className="badge-primary ml-1">Saved for later</span>}
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mt-2">
          <span className="font-bold text-gray-900 dark:text-white">₹{(price * item.quantity).toLocaleString()}</span>
          {discount > 0 && (
            <>
              <span className="text-gray-400 line-through text-xs">₹{(mrp * item.quantity).toLocaleString()}</span>
              <span className="text-green-600 text-xs font-semibold">{discount}% off</span>
            </>
          )}
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          {/* Qty */}
          {!item.isSavedForLater && (
            <div className="flex items-center gap-1">
              <button onClick={() => onUpdate(item._id, item.quantity - 1)} className="qty-btn text-base">−</button>
              <span className="w-8 text-center text-sm font-bold text-gray-800 dark:text-gray-200">{item.quantity}</span>
              <button
                onClick={() => onUpdate(item._id, item.quantity + 1)}
                disabled={item.quantity >= 10 || item.quantity >= (variant?.stock || 10)}
                className="qty-btn text-base"
              >
                +
              </button>
            </div>
          )}

          <button
            onClick={() => onSaveForLater(item._id)}
            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            <BookmarkPlus size={14} />
            {item.isSavedForLater ? 'Move to Cart' : 'Save for Later'}
          </button>

          <button
            onClick={() => onRemove(item._id)}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium"
          >
            <Trash2 size={14} />
            Remove
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function CouponBox({ applied, onApply, onRemove }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    await onApply(code.toUpperCase());
    setLoading(false);
    setCode('');
  };

  return (
    <div className="card p-4">
      <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-3">
        <Tag size={15} className="text-primary-500" /> Apply Coupon
      </p>
      {applied?.code ? (
        <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2">
          <div>
            <span className="font-bold text-green-700 dark:text-green-400 text-sm">{applied.code}</span>
            <p className="text-xs text-green-600">You save ₹{applied.discount?.toLocaleString()}</p>
          </div>
          <button onClick={onRemove} className="text-gray-400 hover:text-red-500 transition-colors">
            <X size={16} />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            className="input text-sm uppercase"
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          />
          <button onClick={handleApply} disabled={loading || !code} className="btn-primary text-sm px-4">
            {loading ? '...' : 'Apply'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function CartPage() {
  const { items, savedItems, itemsTotal, mrpTotal, savings, shippingCharges, total, appliedCoupon,
          updateItem, removeItem, saveForLater, applyCoupon, removeCoupon, isLoading } = useCart();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const allItems    = [...items, ...savedItems];
  const totalItems  = items.length;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {[1,2,3].map((i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  if (totalItems === 0 && savedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}>
          <ShoppingBag size={80} className="text-gray-200 dark:text-gray-700 mx-auto mb-6" />
        </motion.div>
        <h2 className="font-heading text-2xl font-bold text-gray-900 dark:text-white mb-2">Your cart is empty</h2>
        <p className="text-gray-400 mb-6 max-w-sm">
          Looks like you haven't added anything yet. Explore our catalog and find something you'll love!
        </p>
        <Link to="/" className="btn-primary btn-lg">
          Continue Shopping <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  const couponSavings = appliedCoupon?.discount || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6">
      <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
        <ShoppingBag size={28} className="text-primary-500" />
        Shopping Cart
        {totalItems > 0 && (
          <span className="text-lg font-normal text-gray-400">({totalItems} item{totalItems !== 1 ? 's' : ''})</span>
        )}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Cart items */}
        <div className="lg:col-span-2">
          {/* Login notice */}
          {!isLoggedIn && (
            <div className="bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-800 rounded-2xl p-4 mb-4 flex items-center gap-3">
              <AlertCircle size={18} className="text-primary-600 flex-shrink-0" />
              <p className="text-sm text-primary-700 dark:text-primary-300">
                <Link to="/login" className="font-bold hover:underline">Sign in</Link> to sync your cart and save items across devices
              </p>
            </div>
          )}

          {totalItems === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-400">No active cart items. Check saved-for-later section below.</p>
            </div>
          ) : (
            <div className="card p-4 md:p-6">
              <AnimatePresence>
                {items.map((item) => (
                  <CartItem
                    key={item._id}
                    item={item}
                    onUpdate={updateItem}
                    onRemove={removeItem}
                    onSaveForLater={saveForLater}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Saved for later */}
          {savedItems.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <BookmarkPlus size={16} /> Saved for Later ({savedItems.length})
              </h3>
              <div className="card p-4 md:p-6">
                <AnimatePresence>
                  {savedItems.map((item) => (
                    <CartItem
                      key={item._id}
                      item={item}
                      onUpdate={updateItem}
                      onRemove={removeItem}
                      onSaveForLater={saveForLater}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* Order summary */}
        <div className="space-y-4">
          {/* Coupon */}
          {isLoggedIn && (
            <CouponBox
              applied={appliedCoupon}
              onApply={applyCoupon}
              onRemove={removeCoupon}
            />
          )}

          {/* Price summary */}
          {totalItems > 0 && (
            <div className="card p-5 space-y-3">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg border-b border-gray-100 dark:border-gray-800 pb-3">
                Price Details
              </h3>

              <div className="space-y-2.5 text-sm">
                <PriceLine label={`Price (${totalItems} items)`} value={`₹${mrpTotal.toLocaleString()}`} />
                <PriceLine label="Discount" value={`−₹${savings.toLocaleString()}`} valueClass="text-green-600" />
                {couponSavings > 0 && (
                  <PriceLine label={`Coupon (${appliedCoupon.code})`} value={`−₹${couponSavings.toLocaleString()}`} valueClass="text-green-600" />
                )}
                <PriceLine
                  label="Delivery Charges"
                  value={shippingCharges === 0 ? 'FREE' : `₹${shippingCharges}`}
                  valueClass={shippingCharges === 0 ? 'text-green-600 font-semibold' : ''}
                />
                <div className="border-t border-gray-100 dark:border-gray-800 pt-2.5">
                  <PriceLine
                    label="Total Amount"
                    value={`₹${(total - couponSavings).toLocaleString()}`}
                    labelClass="font-bold text-gray-900 dark:text-white text-base"
                    valueClass="font-bold text-gray-900 dark:text-white text-base"
                  />
                </div>
              </div>

              {savings > 0 && (
                <p className="text-green-600 text-sm font-semibold bg-green-50 dark:bg-green-950/20 rounded-xl p-2.5 text-center">
                  🎉 You save ₹{(savings + couponSavings).toLocaleString()} on this order!
                </p>
              )}

              <button
                onClick={() => navigate('/checkout')}
                className="btn-amber btn-lg w-full"
              >
                Proceed to Checkout <ArrowRight size={18} />
              </button>

              <div className="flex items-center justify-center gap-4 text-[10px] text-gray-400 pt-1">
                {['🔒 Secure', '💳 Multiple Payment', '↩️ Easy Return'].map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PriceLine({ label, value, labelClass = 'text-gray-600 dark:text-gray-400', valueClass = 'text-gray-800 dark:text-gray-200' }) {
  return (
    <div className="flex items-center justify-between">
      <span className={labelClass}>{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
