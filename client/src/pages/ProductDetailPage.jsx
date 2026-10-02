import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Heart, Share2, Star, ChevronDown, ChevronUp,
  Shield, Truck, RotateCcw, ZoomIn, CheckCircle, MapPin, Package
} from 'lucide-react';
import { productAPI, reviewAPI } from '../api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import ProductCard, { ProductCardSkeleton, StarRating } from '../components/ProductCard';
import toast from 'react-hot-toast';

// ── Image Gallery ─────────────────────────────────────────────────────
function ImageGallery({ images, productName }) {
  const [selected, setSelected] = useState(0);
  const [zoomed, setZoomed]     = useState(false);

  const imgs = images?.length
    ? images
    : [{ url: `https://placehold.co/600x600/E8EDFF/4E4FEB?text=${encodeURIComponent(productName?.slice(0,8) || 'Product')}` }];

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div
        className="relative rounded-2xl overflow-hidden bg-gray-50 dark:bg-dark-800 aspect-square cursor-zoom-in"
        onClick={() => setZoomed(true)}
      >
        <motion.img
          key={selected}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          src={imgs[selected]?.url}
          alt={productName}
          className="w-full h-full object-contain p-4"
        />
        <button className="absolute top-3 right-3 w-9 h-9 glass rounded-xl flex items-center justify-center text-gray-600">
          <ZoomIn size={18} />
        </button>
      </div>

      {/* Thumbnails */}
      {imgs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {imgs.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                i === selected ? 'border-primary-500 shadow-glow' : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img src={img.url} alt={`${productName} ${i + 1}`} className="w-full h-full object-contain p-1 bg-gray-50" />
            </button>
          ))}
        </div>
      )}

      {/* Zoom modal */}
      <AnimatePresence>
        {zoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setZoomed(false)}
          >
            <img src={imgs[selected]?.url} alt={productName} className="max-w-full max-h-full object-contain rounded-2xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Delivery Estimate ─────────────────────────────────────────────────
function DeliveryEstimate({ productId }) {
  const [pincode, setPincode] = useState('');
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading]   = useState(false);

  const check = async () => {
    if (!/^\d{6}$/.test(pincode)) { toast.error('Enter valid 6-digit pincode'); return; }
    setLoading(true);
    try {
      const { data } = await productAPI.deliveryEstimate(pincode);
      setEstimate(data.data);
    } catch { toast.error('Could not fetch estimate'); }
    finally { setLoading(false); }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2 mb-3">
        <MapPin size={15} className="text-primary-500" /> Delivery Options
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter pincode"
          maxLength={6}
          value={pincode}
          onChange={(e) => { setPincode(e.target.value.replace(/\D/g, '')); setEstimate(null); }}
          className="input text-sm flex-1"
        />
        <button onClick={check} disabled={loading} className="btn-primary text-sm px-4">
          {loading ? '...' : 'Check'}
        </button>
      </div>
      {estimate && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle size={14} /> <span>Delivery by <strong>{estimate.deliveryBy}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Truck size={14} /> {estimate.shippingCharge === 0 ? 'FREE delivery' : `₹${estimate.shippingCharge} shipping`}
          </div>
          {estimate.isCodAvailable && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Package size={14} /> Cash on Delivery available
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ── Reviews Section ───────────────────────────────────────────────────
function ReviewsSection({ productId, ratingsAverage, ratingsCount }) {
  const [reviews, setReviews]   = useState([]);
  const [distribution, setDist] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [sortBy, setSortBy]     = useState('newest');
  const [total, setTotal]       = useState(0);

  useEffect(() => {
    setLoading(true);
    reviewAPI.getProductReviews(productId, { page, sort: sortBy, limit: 5 })
      .then(({ data }) => {
        setReviews(page === 1 ? data.data.reviews : (prev) => [...prev, ...data.data.reviews]);
        setDist(data.data.distribution || []);
        setTotal(data.data.pagination?.total || 0);
      })
      .finally(() => setLoading(false));
  }, [productId, page, sortBy]);

  const avgByRating = (r) => distribution.find((d) => d._id === r)?.count || 0;
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <div>
      {/* Rating summary */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="text-center">
          <div className="text-6xl font-bold text-gray-900 dark:text-white font-heading">
            {ratingsAverage?.toFixed(1) || '0.0'}
          </div>
          <StarRating rating={ratingsAverage} size={20} />
          <p className="text-sm text-gray-400 mt-1">{ratingsCount?.toLocaleString()} ratings</p>
        </div>
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((r) => {
            const cnt = avgByRating(r);
            const pct = total > 0 ? (cnt / total) * 100 : 0;
            return (
              <div key={r} className="flex items-center gap-3">
                <span className="text-sm text-gray-500 w-4">{r}</span>
                <Star size={12} className="text-amber-400 fill-amber-400" />
                <div className="flex-1 h-2 bg-gray-100 dark:bg-dark-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    className="h-full bg-amber-400 rounded-full"
                  />
                </div>
                <span className="text-xs text-gray-400 w-8">{cnt}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-sm text-gray-500">Sort by:</span>
        {['newest', 'helpful', 'rating_h', 'rating_l'].map((s) => (
          <button
            key={s}
            onClick={() => { setSortBy(s); setPage(1); setReviews([]); }}
            className={sortBy === s ? 'tab-pill-active' : 'tab-pill-inactive'}
          >
            {{ newest: 'Newest', helpful: 'Most Helpful', rating_h: 'High Rating', rating_l: 'Low Rating' }[s]}
          </button>
        ))}
      </div>

      {/* Reviews list */}
      <div className="space-y-5">
        {reviews.map((review) => (
          <div key={review._id} className="border-b border-gray-100 dark:border-gray-800 pb-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-sm font-bold text-primary-700 dark:text-primary-300 flex-shrink-0">
                {review.user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">{review.user?.name}</span>
                  {review.verifiedPurchase && (
                    <span className="badge-success text-[10px]">✓ Verified Purchase</span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">
                    {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <StarRating rating={review.rating} size={13} />
                {review.title && <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 mt-1">{review.title}</p>}
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{review.comment}</p>
                {review.images?.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {review.images.map((img, i) => (
                      <img key={i} src={img.url} alt="Review" className="w-14 h-14 rounded-lg object-cover border border-gray-200" />
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-400">Helpful?</span>
                  <button className="text-xs text-gray-500 hover:text-primary-600 border border-gray-200 rounded-lg px-2 py-0.5 transition-colors">
                    👍 {review.helpful?.count || 0}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {loading && <div className="text-center text-sm text-gray-400 py-4">Loading reviews...</div>}

        {!loading && reviews.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Star size={32} className="mx-auto mb-2 opacity-30" />
            <p>No reviews yet. Be the first to review!</p>
          </div>
        )}

        {!loading && reviews.length < total && (
          <button onClick={() => setPage((p) => p + 1)} className="btn-outline w-full">
            Load more reviews
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Product Detail Page ──────────────────────────────────────────
export default function ProductDetailPage() {
  const { slug }      = useParams();
  const navigate      = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct]           = useState(null);
  const [similar, setSimilar]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [qty, setQty]                   = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeTab, setActiveTab]       = useState('description');

  useEffect(() => {
    setLoading(true);
    setProduct(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    productAPI.getProductBySlug(slug)
      .then(({ data }) => {
        const p = data.data.product;
        setProduct(p);
        document.title = `${p.name} — Trove`;
        // Default to first available variant
        const firstAvail = p.variants?.find((v) => v.isActive !== false && v.stock > 0);
        setSelectedVariant(firstAvail || p.variants?.[0]);
        // Fetch similar
        return productAPI.getSimilarProducts(p._id);
      })
      .then(({ data }) => setSimilar(data.data.products))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = useCallback(async (buyNow = false) => {
    if (!selectedVariant) return;
    setAddingToCart(true);
    const ok = await addToCart(product._id, selectedVariant._id, qty);
    setAddingToCart(false);
    if (ok && buyNow) navigate('/cart');
  }, [addToCart, product, selectedVariant, qty, navigate]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="skeleton aspect-square rounded-2xl" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-6 rounded-lg" style={{ width: `${[40, 80, 60, 50, 100, 90][i]}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <span className="text-6xl mb-4">😕</span>
        <h2 className="font-heading text-2xl font-bold text-gray-900 dark:text-white mb-2">Product Not Found</h2>
        <p className="text-gray-400 mb-6">This product may have been removed or doesn't exist.</p>
        <button onClick={() => navigate(-1)} className="btn-primary">Go Back</button>
      </div>
    );
  }

  const price       = selectedVariant?.price;
  const mrp         = selectedVariant?.mrp;
  const discountPct = mrp && price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const inWishlist  = isInWishlist(product._id);
  const outOfStock  = !selectedVariant || selectedVariant.stock <= 0;
  const variants     = Array.isArray(product.variants) ? product.variants : [];

  // Group variants by color / size
  const uniqueColors  = [...new Set(variants.filter((v) => v.color).map((v) => v.color))];
  const uniqueSizes   = [...new Set(variants.filter((v) => v.size).map((v) => v.size))];
  const uniqueStorage = [...new Set(variants.filter((v) => v.storage).map((v) => v.storage))];

  const selectVariantBy = (key, value) => {
    const match = variants.find((v) => {
      const matchCurrent = Object.keys(selectedVariant || {}).reduce((acc, k) => {
        if (k !== key && ['color', 'size', 'storage'].includes(k) && selectedVariant[k]) acc[k] = selectedVariant[k];
        return acc;
      }, {});
      matchCurrent[key] = value;
      return Object.entries(matchCurrent).every(([k, val]) => !val || v[k] === val);
    }) || variants.find((v) => v[key] === value);
    if (match) setSelectedVariant(match);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 lg:pb-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-5 flex-wrap">
        <button onClick={() => navigate('/')} className="hover:text-primary-600">Home</button>
        <span>/</span>
        <button onClick={() => navigate(`/category/${product.category?.slug}`)} className="hover:text-primary-600 capitalize">
          {product.category?.name}
        </button>
        <span>/</span>
        <span className="text-gray-600 dark:text-gray-400 truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14">

        {/* Left: Images */}
        <div>
          <ImageGallery images={product.images} productName={product.name} />
        </div>

        {/* Right: Info */}
        <div className="space-y-5">

          {/* Brand + badges */}
          <div className="flex items-center gap-3 flex-wrap">
            {product.brand && (
              <span className="badge-primary text-xs font-bold uppercase">{product.brand}</span>
            )}
            {product.isBestSeller && <span className="badge-amber text-xs">🔥 Best Seller</span>}
            {product.isNewArrival && <span className="badge-primary text-xs">✨ New Arrival</span>}
            {outOfStock && <span className="badge-error text-xs">Out of Stock</span>}
          </div>

          {/* Title */}
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-green-600 text-white text-sm font-bold px-2.5 py-1 rounded-lg">
              {product.ratingsAverage?.toFixed(1)} <Star size={13} className="fill-white" />
            </div>
            <span className="text-sm text-gray-500">
              {product.ratingsCount?.toLocaleString()} ratings & {Math.floor((product.ratingsCount || 0) * 0.3)} reviews
            </span>
          </div>

          <div className="divider" />

          {/* Price */}
          <div className="space-y-1">
            <div className="flex items-end gap-3 flex-wrap">
              <span className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
                ₹{price?.toLocaleString() ?? '—'}
              </span>
              {discountPct > 0 && (
                <>
                  <span className="text-gray-400 line-through text-lg">₹{mrp?.toLocaleString()}</span>
                  <span className="badge-discount text-sm px-3 py-1">{discountPct}% OFF</span>
                </>
              )}
            </div>
            {discountPct > 0 && (
              <p className="text-green-600 text-sm font-semibold">
                You save ₹{((mrp || 0) - (price || 0)).toLocaleString()}
              </p>
            )}
            {price >= 499 && (
              <p className="text-xs text-primary-600">🚚 FREE Delivery eligible</p>
            )}
          </div>

          {/* Color selector */}
          {uniqueColors.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Color: <span className="font-normal text-gray-500">{selectedVariant?.color}</span>
              </p>
              <div className="flex gap-2 flex-wrap">
                {uniqueColors.map((color) => {
                  const v = variants.find((vv) => vv.color === color);
                  return (
                    <button
                      key={color}
                      onClick={() => selectVariantBy('color', color)}
                      title={color}
                      className={`w-9 h-9 rounded-xl border-2 transition-all hover:scale-110 ${
                        selectedVariant?.color === color ? 'border-primary-500 shadow-glow scale-110' : 'border-gray-200 dark:border-gray-600'
                      }`}
                      style={{ background: v?.colorHex || '#ccc' }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Size selector */}
          {uniqueSizes.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Size: <span className="font-normal text-gray-500">{selectedVariant?.size}</span>
              </p>
              <div className="flex gap-2 flex-wrap">
                {uniqueSizes.map((size) => {
                  const v = variants.find((vv) => vv.size === size);
                  const available = v && v.stock > 0;
                  return (
                    <button
                      key={size}
                      onClick={() => available && selectVariantBy('size', size)}
                      disabled={!available}
                      className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                        selectedVariant?.size === size
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : available
                          ? 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-300'
                          : 'border-gray-100 text-gray-300 cursor-not-allowed line-through'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Storage selector */}
          {uniqueStorage.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Storage</p>
              <div className="flex gap-2 flex-wrap">
                {uniqueStorage.map((s) => (
                  <button
                    key={s}
                    onClick={() => selectVariantBy('storage', s)}
                    className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                      selectedVariant?.storage === s
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock indicator */}
          {!outOfStock && selectedVariant.stock <= 10 && (
            <p className="text-sm font-semibold text-red-500 animate-pulse">
              ⚡ Only {selectedVariant.stock} left in stock!
            </p>
          )}

          {/* Quantity */}
          {!outOfStock && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Qty:</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="qty-btn">−</button>
                <span className="w-10 text-center font-bold text-gray-800 dark:text-gray-200">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(selectedVariant.stock, 10, q + 1))}
                  className="qty-btn"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* CTAs */}
          <div className="flex gap-3">
            <button
              onClick={() => handleAddToCart(false)}
              disabled={outOfStock || addingToCart}
              className={`flex-1 btn-lg ${outOfStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'btn-outline'}`}
            >
              {addingToCart ? (
                <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <><ShoppingCart size={18} /> Add to Cart</>
              )}
            </button>
            <button
              onClick={() => handleAddToCart(true)}
              disabled={outOfStock}
              className={`flex-1 btn-lg ${outOfStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'btn-amber'}`}
            >
              Buy Now
            </button>
            <button
              onClick={() => toggleWishlist(product._id)}
              className={`btn-icon btn-lg border-2 transition-all ${inWishlist ? 'border-red-400 bg-red-50 text-red-500' : 'border-gray-200 text-gray-500'}`}
            >
              <Heart size={20} className={inWishlist ? 'fill-red-500' : ''} />
            </button>
          </div>

          {/* Sold by */}
          {product.seller && (
            <p className="text-sm text-gray-500">
              Sold by <span className="font-semibold text-primary-600">{product.seller.displayName || product.seller.businessName}</span>
              {product.seller.rating > 0 && (
                <span className="ml-2 text-amber-500">★ {product.seller.rating.toFixed(1)}</span>
              )}
            </p>
          )}

          {/* Delivery estimate */}
          <DeliveryEstimate productId={product._id} />

          {/* Highlights */}
          {product.highlights?.length > 0 && (
            <div className="border border-gray-100 dark:border-gray-700 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Highlights</p>
              <ul className="space-y-2">
                {product.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <CheckCircle size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Trust signals */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Shield,    label: '1 Year Warranty' },
              { icon: RotateCcw, label: '10-Day Return' },
              { icon: Truck,     label: 'Fast Delivery' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center text-center gap-1.5 p-3 bg-gray-50 dark:bg-dark-800 rounded-xl">
                <Icon size={18} className="text-primary-500" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs: Description / Specs / Reviews */}
      <div className="mt-12">
        <div className="flex gap-2 border-b border-gray-100 dark:border-gray-800 overflow-x-auto hide-scrollbar">
          {[
            { id: 'description', label: 'Description' },
            { id: 'specs',       label: 'Specifications' },
            { id: 'reviews',     label: `Reviews (${product.ratingsCount || 0})` },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-5 py-3 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors ${
                activeTab === id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="py-6">
          {activeTab === 'description' && (
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          )}

          {activeTab === 'specs' && (
            <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800">
              {product.specifications?.length > 0 ? (
                <table className="w-full text-sm">
                  <tbody>
                    {product.specifications.map((spec, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-gray-50 dark:bg-dark-800' : 'bg-white dark:bg-dark-900'}>
                        <td className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 w-40">{spec.key}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-400 text-center py-8">No specifications available</p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <ReviewsSection
              productId={product._id}
              ratingsAverage={product.ratingsAverage}
              ratingsCount={product.ratingsCount}
            />
          )}
        </div>
      </div>

      {/* Similar Products */}
      {similar.length > 0 && (
        <div className="mt-10">
          <h2 className="section-title mb-5">Similar Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {similar.slice(0, 5).map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
