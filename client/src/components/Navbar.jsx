import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShoppingCart, Heart, User, Menu, X,
  ChevronDown, Sun, Moon, Package, LogOut, Settings,
  Bell, Zap, Home, LayoutGrid
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { productAPI, publicAPI } from '../api';

const CATEGORIES = [
  { name: 'Electronics',    slug: 'electronics',   icon: '📱', subs: ['Smartphones', 'Laptops', 'Headphones', 'Tablets', 'Cameras'] },
  { name: 'Fashion',        slug: 'fashion',        icon: '👗', subs: ["Men's Fashion", "Women's Fashion", 'Footwear', 'Watches', 'Bags'] },
  { name: 'Home & Kitchen', slug: 'home-kitchen',   icon: '🏠', subs: ['Furniture', 'Kitchen', 'Decor', 'Bedding', 'Lighting'] },
  { name: 'Books',          slug: 'books',          icon: '📚', subs: ['Fiction', 'Self-Help', 'Technology', 'Business', 'Children'] },
  { name: 'Sports',         slug: 'sports',         icon: '⚽', subs: ['Fitness', 'Cricket', 'Cycling', 'Yoga', 'Running'] },
  { name: 'Beauty',         slug: 'beauty',         icon: '💄', subs: ['Skincare', 'Hair Care', 'Makeup', 'Fragrances', 'Men\'s Grooming'] },
];

export default function Navbar() {
  const { user, isLoggedIn, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery]   = useState('');
  const [suggestions, setSuggestions]   = useState([]);
  const [isSearchFocused, setSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [activeCat, setActiveCat]       = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [darkMode, setDarkMode]         = useState(() => localStorage.getItem('darkMode') === 'true');
  const [isScrolled, setIsScrolled]     = useState(false);

  const searchRef  = useRef(null);
  const debounceRef= useRef(null);

  // ── Dark mode ──
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // ── Sticky navbar ──
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Recent searches ──
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(stored);
  }, []);

  // ── Autocomplete ──
  const handleSearchChange = useCallback((e) => {
    const q = e.target.value;
    setSearchQuery(q);

    clearTimeout(debounceRef.current);
    if (q.length < 2) { setSuggestions([]); return; }

    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await productAPI.autocomplete(q);
        setSuggestions(data.data.suggestions || []);
      } catch { setSuggestions([]); }
    }, 280);
  }, []);

  const handleSearch = (q = searchQuery) => {
    if (!q.trim()) return;
    const recents = [q, ...recentSearches.filter((s) => s !== q)].slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(recents));
    setRecentSearches(recents);
    setSearchFocused(false);
    setSuggestions([]);
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      {/* ── Top promo bar ── */}
      <div className="bg-gradient-primary text-white text-xs text-center py-1.5 px-4 font-medium tracking-wide">
        🎉 Free delivery on orders above ₹499 &nbsp;|&nbsp; Use code{' '}
        <span className="font-bold text-amber-300">TROVE10</span> for 10% off your first order
      </div>

      {/* ── Main navbar ── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 dark:bg-dark-900/95 backdrop-blur-md shadow-md'
            : 'bg-white dark:bg-dark-900 shadow-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Zap size={18} className="text-white fill-white" />
              </div>
              <span className="font-heading text-xl font-bold text-gradient-primary hidden sm:block">
                Trove
              </span>
            </Link>

            {/* Category mega-menu trigger (desktop) */}
            <div className="hidden lg:block relative group">
              <button
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium
                           text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800
                           transition-all"
                onMouseEnter={() => setActiveCat(CATEGORIES[0].slug)}
              >
                <LayoutGrid size={16} />
                All Categories
                <ChevronDown size={14} />
              </button>

              {/* Mega menu */}
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute left-0 top-full mt-1 w-[680px] bg-white dark:bg-dark-800
                             rounded-2xl shadow-card-lg border border-gray-100 dark:border-gray-700
                             p-4 hidden group-hover:grid grid-cols-3 gap-2 z-50"
                  onMouseLeave={() => setActiveCat(null)}
                >
                  {/* Left: category list */}
                  <div className="col-span-1 border-r border-gray-100 dark:border-gray-700 pr-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.slug}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm
                                   text-left transition-all ${
                                     activeCat === cat.slug
                                       ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-700'
                                       : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-900'
                                   }`}
                        onMouseEnter={() => setActiveCat(cat.slug)}
                        onClick={() => navigate(`/category/${cat.slug}`)}
                      >
                        <span>{cat.icon}</span>
                        <span className="font-medium">{cat.name}</span>
                        <ChevronDown size={12} className="ml-auto -rotate-90" />
                      </button>
                    ))}
                  </div>

                  {/* Right: subcategories */}
                  <div className="col-span-2 pl-2">
                    {CATEGORIES.filter((c) => c.slug === activeCat).map((cat) => (
                      <div key={cat.slug}>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">
                          {cat.name}
                        </p>
                        <div className="grid grid-cols-2 gap-1">
                          {cat.subs.map((sub) => (
                            <button
                              key={sub}
                              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm
                                         text-gray-600 dark:text-gray-300 hover:bg-primary-50
                                         dark:hover:bg-primary-950/30 hover:text-primary-700 transition-all text-left"
                              onClick={() => {
                                navigate(`/category/${cat.slug}?sub=${sub.toLowerCase().replace(/\s+/g, '-')}`);
                              }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-primary-300 flex-shrink-0" />
                              {sub}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Search bar */}
            <div className="flex-1 relative" ref={searchRef}>
              <div
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 bg-gray-50
                            dark:bg-dark-800 transition-all duration-200 ${
                              isSearchFocused
                                ? 'border-primary-500 shadow-glow bg-white dark:bg-dark-800'
                                : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                            }`}
              >
                <Search size={18} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search products, brands, categories..."
                  className="flex-1 bg-transparent outline-none text-sm text-gray-800
                             dark:text-gray-200 placeholder-gray-400 min-w-0"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(''); setSuggestions([]); }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Suggestions dropdown */}
              <AnimatePresence>
                {isSearchFocused && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-dark-800
                               rounded-2xl shadow-card-lg border border-gray-100 dark:border-gray-700
                               z-50 overflow-hidden"
                  >
                    {suggestions.length > 0 ? (
                      <>
                        <div className="p-2">
                          {suggestions.map((s, i) => (
                            <button
                              key={i}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                                         hover:bg-gray-50 dark:hover:bg-dark-900 text-left transition-colors"
                              onClick={() => { setSearchQuery(s.label); handleSearch(s.label); }}
                            >
                              {s.image && (
                                <img src={s.image} alt={s.label}
                                  className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                              )}
                              <div>
                                <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{s.label}</p>
                                {s.brand && <p className="text-xs text-gray-400">{s.brand}</p>}
                              </div>
                              <Search size={14} className="ml-auto text-gray-300" />
                            </button>
                          ))}
                        </div>
                      </>
                    ) : recentSearches.length > 0 ? (
                      <div className="p-2">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 py-1.5">
                          Recent Searches
                        </p>
                        {recentSearches.map((s, i) => (
                          <button
                            key={i}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl
                                       hover:bg-gray-50 dark:hover:bg-dark-900 text-left"
                            onClick={() => { setSearchQuery(s); handleSearch(s); }}
                          >
                            <Search size={14} className="text-gray-300 flex-shrink-0" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">{s}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-400">Start typing to search</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action icons */}
            <div className="flex items-center gap-1">

              {/* Dark mode */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="btn-icon text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800 hidden md:flex"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Wishlist */}
              <Link
                to={isLoggedIn ? '/wishlist' : '/login'}
                className="btn-icon text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800 hidden md:flex"
              >
                <Heart size={20} />
              </Link>

              {/* Cart */}
              <Link to="/cart" className="btn-icon relative text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800 flex">
                <ShoppingCart size={20} />
                {itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 1.5 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white
                               text-[10px] font-bold rounded-full flex items-center justify-center"
                  >
                    {itemCount > 99 ? '99+' : itemCount}
                  </motion.span>
                )}
              </Link>

              {/* User menu */}
              <div className="relative">
                <button
                  className="btn-icon text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800 flex items-center gap-1.5"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  onBlur={() => setTimeout(() => setUserMenuOpen(false), 200)}
                >
                  {user?.avatar?.url ? (
                    <img src={user.avatar.url} alt={user.name}
                      className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <User size={20} />
                  )}
                  {isLoggedIn && (
                    <span className="text-sm font-medium hidden lg:block max-w-[80px] truncate">
                      {user?.name?.split(' ')[0]}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-dark-800
                                 rounded-2xl shadow-card-lg border border-gray-100 dark:border-gray-700
                                 py-2 z-50"
                    >
                      {isLoggedIn ? (
                        <>
                          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white">{user?.name}</p>
                            <p className="text-xs text-gray-400">{user?.email}</p>
                          </div>
                          {[
                            { icon: Package,  label: 'My Orders',  href: '/orders'   },
                            { icon: Heart,    label: 'Wishlist',   href: '/wishlist'  },
                            { icon: User,     label: 'Profile',    href: '/account'   },
                            ...(user?.role === 'admin'  ? [{ icon: Settings, label: 'Admin Panel', href: '/admin' }]  : []),
                            ...(user?.role === 'seller' ? [{ icon: Settings, label: 'Seller Panel', href: '/seller' }] : []),
                          ].map(({ icon: Icon, label, href }) => (
                            <Link
                              key={href}
                              to={href}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700
                                         dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-900 transition-colors"
                            >
                              <Icon size={15} className="text-gray-400" />
                              {label}
                            </Link>
                          ))}
                          <div className="border-t border-gray-100 dark:border-gray-700 mt-1">
                            <button
                              onClick={handleLogout}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600
                                         hover:bg-red-50 w-full transition-colors"
                            >
                              <LogOut size={15} />
                              Logout
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <Link to="/login" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-900">
                            <User size={15} className="text-gray-400" /> Login
                          </Link>
                          <Link to="/register" className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary-600 font-medium hover:bg-primary-50">
                            <Zap size={15} /> Create Account
                          </Link>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile menu */}
              <button
                className="btn-icon text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800 lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile side drawer ── */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black z-40 lg:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.25 }}
                className="fixed top-0 left-0 h-full w-72 bg-white dark:bg-dark-900 z-50
                           lg:hidden shadow-xl overflow-y-auto"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                  <Link to="/" className="font-heading text-xl font-bold text-gradient-primary" onClick={() => setMobileMenuOpen(false)}>
                    Trove
                  </Link>
                  <button onClick={() => setMobileMenuOpen(false)}>
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>
                <div className="p-4 space-y-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => { navigate(`/category/${cat.slug}`); setMobileMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-700
                                 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-800 text-sm font-medium"
                    >
                      <span className="text-xl">{cat.icon}</span>
                      {cat.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-900 border-t border-gray-100
                      dark:border-gray-800 flex items-center justify-around px-2 py-1 z-40 lg:hidden
                      safe-area-inset-bottom">
        {[
          { icon: Home,         label: 'Home',     href: '/' },
          { icon: LayoutGrid,   label: 'Categories',href: '/category/electronics' },
          { icon: ShoppingCart, label: 'Cart',     href: '/cart',     badge: itemCount },
          { icon: Heart,        label: 'Wishlist', href: '/wishlist' },
          { icon: User,         label: 'Account',  href: isLoggedIn ? '/account' : '/login' },
        ].map(({ icon: Icon, label, href, badge }) => (
          <Link
            key={href}
            to={href}
            className={`mobile-nav-item ${location.pathname === href ? 'mobile-nav-item-active' : ''}`}
          >
            <div className="relative">
              <Icon size={22} />
              {badge > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-amber-500 text-white
                                 text-[9px] font-bold rounded-full flex items-center justify-center">
                  {badge}
                </span>
              )}
            </div>
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
