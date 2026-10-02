import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Star, ShoppingCart, Zap, Eye } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

// ── Skeleton ──────────────────────────────────────────────────────────
export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-square w-full" />
      <div className="p-4 space-y-2.5">
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="flex gap-2 mt-3">
          <div className="skeleton h-6 w-16 rounded" />
          <div className="skeleton h-6 w-12 rounded" />
        </div>
        <div className="skeleton h-9 w-full rounded-xl mt-2" />
      </div>
    </div>
  );
}

// ── Star Rating ───────────────────────────────────────────────────────
export function StarRating({ rating = 0, count, size = 14 }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={size}
            className={s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 dark:text-gray-700'}
          />
        ))}
      </div>
      {count !== undefined && (
        <span className="text-xs text-gray-400">({count.toLocaleString()})</span>
      )}
    </div>
  );
}

// ── Main ProductCard ──────────────────────────────────────────────────
export default function ProductCard({ product, variant = 'default' }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [addingToCart, setAddingToCart] = useState(false);

  if (!product) return <ProductCardSkeleton />;

  // Use the cheapest active variant as display variant
  const displayVariant = product.variants?.find(
    (v) => v.isActive !== false && v.stock > 0
  ) || product.variants?.[0];

  const price          = displayVariant?.price;
  const mrp            = displayVariant?.mrp;
  const discountPct    = mrp && price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const primaryImage   = product.images?.[0]?.url || `https://placehold.co/400x400/E8EDFF/4E4FEB?text=${encodeURIComponent(product.name?.slice(0, 8))}`;
  const inWishlist     = isInWishlist(product._id);
  const outOfStock     = !displayVariant || displayVariant.stock === 0;

  const handleAddToCart = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!displayVariant || outOfStock) return;
    setAddingToCart(true);
    await addToCart(product._id, displayVariant._id, 1);
    setAddingToCart(false);
  }, [addToCart, product._id, displayVariant, outOfStock]);

  const handleWishlist = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product._id);
  }, [toggleWishlist, product._id]);

  if (variant === 'horizontal') {
    return (
      <Link to={`/product/${product.slug}`} className="card-hover flex gap-4 p-4 group">
        <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50">
          <img src={primaryImage} alt={product.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-primary-500 font-semibold mb-1">{product.brand}</p>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate-2 leading-snug">
            {product.name}
          </h3>
          <StarRating rating={product.ratingsAverage} count={product.ratingsCount} size={12} />
          <div className="flex items-center gap-2 mt-2">
            <span className="font-bold text-gray-900 dark:text-white">₹{price?.toLocaleString()}</span>
            {discountPct > 0 && <span className="badge-discount text-xs">{discountPct}% off</span>}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/product/${product.slug}`} className="product-card group block">
        {/* Image */}
        <div className="relative overflow-hidden bg-gray-50 dark:bg-dark-800">
          <img
            src={primaryImage}
            alt={product.name}
            className="product-card-img"
            loading="lazy"
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discountPct >= 10 && (
              <span className="badge-discount text-[10px] px-1.5 py-0.5">{discountPct}% OFF</span>
            )}
            {product.isNewArrival && (
              <span className="badge bg-primary-500 text-white text-[10px] px-1.5 py-0.5">NEW</span>
            )}
            {product.isBestSeller && (
              <span className="badge bg-amber-500 text-white text-[10px] px-1.5 py-0.5">🔥 BESTSELLER</span>
            )}
            {outOfStock && (
              <span className="badge bg-gray-800/80 text-white text-[10px] px-1.5 py-0.5">OUT OF STOCK</span>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white dark:bg-dark-800
                       shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100
                       transition-all duration-200 hover:scale-110"
            aria-label="Add to wishlist"
          >
            <Heart
              size={16}
              className={inWishlist ? 'text-red-500 fill-red-500' : 'text-gray-400'}
            />
          </button>

          {/* Quick view overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/40 to-transparent
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3">
            <div className="flex items-center justify-center gap-1 text-white text-xs font-medium">
              <Eye size={12} />
              Quick View
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 space-y-1">
          {product.brand && (
            <p className="text-[11px] text-primary-600 dark:text-primary-400 font-semibold uppercase tracking-wide">
              {product.brand}
            </p>
          )}
          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate-2 leading-snug min-h-[2.5rem]">
            {product.name}
          </h3>

          <StarRating rating={product.ratingsAverage} count={product.ratingsCount} size={12} />

          {/* Pricing */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-base font-bold text-gray-900 dark:text-white">
              ₹{price?.toLocaleString() ?? '—'}
            </span>
            {discountPct > 0 && (
              <>
                <span className="text-xs text-gray-400 line-through">₹{mrp?.toLocaleString()}</span>
                <span className="text-xs text-green-600 font-semibold">{discountPct}% off</span>
              </>
            )}
          </div>

          {/* Seller */}
          {product.seller?.displayName && (
            <p className="text-[10px] text-gray-400">by {product.seller.displayName}</p>
          )}

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={outOfStock || addingToCart}
            className={`w-full mt-2 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5
                        transition-all duration-200 ${
                          outOfStock
                            ? 'bg-gray-100 dark:bg-dark-700 text-gray-400 cursor-not-allowed'
                            : 'btn-primary'
                        }`}
          >
            {addingToCart ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : outOfStock ? (
              'Out of Stock'
            ) : (
              <>
                <ShoppingCart size={14} />
                Add to Cart
              </>
            )}
          </button>
        </div>
      </Link>
    </motion.div>
  );
}
