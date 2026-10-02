import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, Zap, TrendingUp, Gift, ArrowRight, Star } from 'lucide-react';
import { productAPI, publicAPI } from '../api';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';

// ── Hero Banner Carousel ──────────────────────────────────────────────
function HeroBanner({ banners }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  const DEFAULT_BANNERS = [
    { title: 'The Big Sale — Up to 70% Off', subtitle: 'On Electronics, Fashion & More', linkUrl: '/category/electronics', linkText: 'Shop Now', bgColor: '#2A2A72', image: { url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80' } },
    { title: 'New Fashion Arrivals', subtitle: 'Trending styles for the season', linkUrl: '/category/fashion', linkText: 'Explore Collection', bgColor: '#5C0A14', image: { url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80' } },
    { title: 'Home Makeover Sale', subtitle: 'Beautiful furniture & decor', linkUrl: '/category/home-kitchen', linkText: 'Shop Home', bgColor: '#1B4332', image: { url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80' } },
  ];

  const slides = banners?.length > 0 ? banners : DEFAULT_BANNERS;

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent((p) => (p + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [slides.length]);

  const go = (dir) => {
    clearInterval(timerRef.current);
    setCurrent((p) => (p + dir + slides.length) % slides.length);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl h-64 sm:h-80 md:h-96 lg:h-[480px] bg-gray-900">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 flex items-center"
        >
          {/* Background image */}
          <img
            src={slides[current].image?.url}
            alt={slides[current].title}
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
          {/* Color overlay */}
          <div
            className="absolute inset-0 opacity-75"
            style={{ background: `linear-gradient(135deg, ${slides[current].bgColor} 0%, transparent 100%)` }}
          />

          {/* Content */}
          <div className="relative z-10 px-8 md:px-16 max-w-2xl">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-400/30
                         rounded-full px-3 py-1 text-xs font-semibold mb-3"
            >
              <Zap size={12} className="fill-amber-300" />
              Limited Time Offer
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-heading text-3xl md:text-5xl font-bold text-white leading-tight mb-3"
            >
              {slides[current].title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              className="text-white/70 text-base md:text-lg mb-6"
            >
              {slides[current].subtitle}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Link to={slides[current].linkUrl} className="btn-amber btn-lg gap-2">
                {slides[current].linkText}
                <ArrowRight size={18} />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Nav arrows */}
      {slides.length > 1 && (
        <>
          <button onClick={() => go(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass flex items-center justify-center text-white hover:bg-white/20 transition-all z-20">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => go(1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass flex items-center justify-center text-white hover:bg-white/20 transition-all z-20">
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  );
}

// ── Flash Deals Countdown ─────────────────────────────────────────────
function FlashDealsSection({ products, loading }) {
  const [timeLeft, setTimeLeft] = useState({ h: 5, m: 30, s: 0 });

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft((t) => {
        let { h, m, s } = t;
        s -= 1;
        if (s < 0) { s = 59; m -= 1; }
        if (m < 0) { m = 59; h -= 1; }
        if (h < 0) return { h: 5, m: 59, s: 59 };
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <section>
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-amber-500 rounded-full" />
          <div>
            <h2 className="section-title flex items-center gap-2">
              <Zap size={22} className="text-amber-500 fill-amber-500" />
              Flash Deals
            </h2>
            <p className="section-subtitle text-xs">Hurry! Ends in</p>
          </div>
          {/* Countdown */}
          <div className="flex items-center gap-1 ml-2">
            {[timeLeft.h, timeLeft.m, timeLeft.s].map((val, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="bg-gray-900 dark:bg-dark-800 text-white font-mono font-bold text-lg px-2 py-1 rounded-lg min-w-[40px] text-center">
                  {pad(val)}
                </span>
                {i < 2 && <span className="font-bold text-gray-400 text-xl">:</span>}
              </span>
            ))}
          </div>
        </div>
        <Link to="/search?sort=discount" className="text-primary-600 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
          See all <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.length > 0
          ? products.map((p) => <ProductCard key={p._id} product={p} />)
          : <p className="col-span-full text-sm text-gray-400 py-8 text-center">No flash deals available right now.</p>
        }
      </div>
    </section>
  );
}

// ── Category Tiles ─────────────────────────────────────────────────────
const CATEGORY_TILES = [
  { name: 'Electronics',    slug: 'electronics',   icon: '📱', gradient: 'from-blue-600 to-indigo-700',   img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80' },
  { name: 'Fashion',        slug: 'fashion',        icon: '👗', gradient: 'from-pink-500 to-rose-700',     img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80' },
  { name: 'Home & Kitchen', slug: 'home-kitchen',   icon: '🏠', gradient: 'from-green-500 to-teal-700',    img: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80' },
  { name: 'Books',          slug: 'books',          icon: '📚', gradient: 'from-amber-500 to-orange-700',  img: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&q=80' },
  { name: 'Sports',         slug: 'sports',         icon: '⚽', gradient: 'from-emerald-500 to-green-700', img: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&q=80' },
  { name: 'Beauty',         slug: 'beauty',         icon: '💄', gradient: 'from-purple-500 to-violet-700', img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80' },
  { name: 'Toys',           slug: 'toys',           icon: '🎮', gradient: 'from-yellow-500 to-amber-700',  img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80' },
  { name: 'Grocery',        slug: 'grocery',        icon: '🛒', gradient: 'from-lime-500 to-green-700',    img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80' },
];

function CategoryGrid() {
  const navigate = useNavigate();
  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-primary-500 rounded-full" />
          <h2 className="section-title">Shop by Category</h2>
        </div>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-3">
        {CATEGORY_TILES.map((cat, i) => (
          <motion.button
            key={cat.slug}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate(`/category/${cat.slug}`)}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-primary-50
                       dark:hover:bg-primary-950/20 transition-all duration-200 group"
          >
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${cat.gradient}
                             flex items-center justify-center text-2xl sm:text-3xl shadow-md
                             group-hover:shadow-glow group-hover:scale-110 transition-all duration-300`}>
              {cat.icon}
            </div>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center leading-tight">
              {cat.name}
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

// ── Main Home Page ─────────────────────────────────────────────────────
export default function HomePage() {
  const [banners, setBanners]           = useState([]);
  const [flashDeals, setFlashDeals]     = useState([]);
  const [featured, setFeatured]         = useState([]);
  const [newArrivals, setNewArrivals]   = useState([]);
  const [bestSellers, setBestSellers]   = useState([]);
  const [recommended, setRecommended]   = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsLoadFailed, setProductsLoadFailed] = useState(false);

  useEffect(() => {
    document.title = 'Trove — Shop Everything You Love';

    const loadHomepage = async () => {
      const requests = await Promise.allSettled([
        publicAPI.getBanners('hero'),
        productAPI.getProducts({ sort: 'discount', limit: 6, inStock: true }),
        productAPI.getProducts({ isFeatured: true, limit: 8 }),
        productAPI.getProducts({ isNewArrival: true, limit: 8 }),
        productAPI.getProducts({ isBestSeller: true, limit: 8 }),
        productAPI.getProducts({ sort: 'rating', limit: 8 }),
      ]);
      const value = (index, key) => requests[index].status === 'fulfilled'
        ? requests[index].value.data.data[key] || []
        : [];

      setBanners(value(0, 'banners'));
      setFlashDeals(value(1, 'products'));
      setFeatured(value(2, 'products'));
      setNewArrivals(value(3, 'products'));
      setBestSellers(value(4, 'products'));
      setRecommended(value(5, 'products'));
      setProductsLoadFailed(requests.slice(1).some((request) => request.status === 'rejected'));
      setLoadingProducts(false);
    };

    loadHomepage();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12 page-enter">

      {/* Hero Banner */}
      <HeroBanner banners={banners} />

      {/* Trust strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: '🚚', title: 'Free Delivery',     sub: 'On orders above ₹499' },
          { icon: '↩️', title: 'Easy Returns',      sub: '10-day return policy' },
          { icon: '🔒', title: '100% Secure',       sub: 'Protected checkout' },
          { icon: '🎧', title: '24/7 Support',      sub: 'Dedicated customer care' },
        ].map(({ icon, title, sub }) => (
          <div key={title} className="card p-4 flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{title}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Category Grid */}
      <CategoryGrid />

      {/* Flash Deals */}
      <FlashDealsSection products={flashDeals} loading={loadingProducts} />

      {/* Featured Products */}
      <ProductSection
        title="Featured Products"
        subtitle="Curated picks just for you"
        icon={<Star size={20} className="text-amber-400 fill-amber-400" />}
        products={featured}
        loading={loadingProducts}
        viewAllHref="/search?isFeatured=true"
      />

      {/* New Arrivals */}
      <ProductSection
        title="New Arrivals"
        subtitle="Fresh drops you'll love"
        icon={<Zap size={20} className="text-primary-500" />}
        products={newArrivals}
        loading={loadingProducts}
        viewAllHref="/search?isNewArrival=true"
      />

      {/* Banner ad strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/category/electronics" className="relative rounded-2xl overflow-hidden h-40 group">
          <img src="https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80"
            alt="Electronics" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/80 to-transparent p-6 flex flex-col justify-center">
            <p className="text-xs text-amber-300 font-semibold mb-1">UP TO 40% OFF</p>
            <h3 className="font-heading text-xl font-bold text-white">Latest Smartphones</h3>
            <p className="text-white/70 text-sm mt-1">Shop the newest releases</p>
          </div>
        </Link>
        <Link to="/category/fashion" className="relative rounded-2xl overflow-hidden h-40 group">
          <img src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80"
            alt="Fashion" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-r from-rose-900/80 to-transparent p-6 flex flex-col justify-center">
            <p className="text-xs text-amber-300 font-semibold mb-1">TRENDING NOW</p>
            <h3 className="font-heading text-xl font-bold text-white">Fashion Week Sale</h3>
            <p className="text-white/70 text-sm mt-1">Up to 50% on top brands</p>
          </div>
        </Link>
      </div>

      {/* Best Sellers */}
      <ProductSection
        title="Best Sellers"
        subtitle="Most loved by our customers"
        icon={<TrendingUp size={20} className="text-green-500" />}
        products={bestSellers}
        loading={loadingProducts}
        viewAllHref="/search?isBestSeller=true"
      />

      {/* Recommended */}
      <ProductSection
        title="Recommended for You"
        subtitle="Based on top ratings"
        icon={<Gift size={20} className="text-purple-500" />}
        products={recommended}
        loading={loadingProducts}
        viewAllHref="/search?sort=rating"
      />
    </div>
  );
}

// ── Reusable section ──────────────────────────────────────────────────
function ProductSection({ title, subtitle, icon, products, viewAllHref, loading }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-primary-500 rounded-full" />
          <div>
            <h2 className="section-title flex items-center gap-2">{icon}{title}</h2>
            {subtitle && <p className="section-subtitle">{subtitle}</p>}
          </div>
        </div>
        <Link to={viewAllHref} className="text-primary-600 text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
          View all <ArrowRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.length > 0
          ? products.map((p) => <ProductCard key={p._id} product={p} />)
          : <p className="col-span-full text-sm text-gray-400 py-6 text-center">No products available in this section.</p>
        }
      </div>
    </section>
  );
}
