import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown, ChevronUp, LayoutGrid, List } from 'lucide-react';
import { productAPI } from '../api';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard';

const SORT_OPTIONS = [
  { label: 'Relevance',     value: 'relevance' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Newest First',  value: 'newest' },
  { label: 'Top Rated',     value: 'rating' },
  { label: 'Most Popular',  value: 'popular' },
  { label: 'Best Discount', value: 'discount' },
];

const RATING_OPTIONS = [4, 3, 2, 1];

const BRANDS_BY_CATEGORY = {
  electronics: ['Nova', 'Pixel', 'Samsung', 'Apple', 'SoundWave', 'SwiftBook', 'BassFlow'],
  fashion:     ['UrbanFlex', 'TrailBlazer', 'Bloom', 'DenimCo', 'Luxe Tempo'],
  'home-kitchen': ['Arthaus', 'LumiHome', 'ProChef', 'BambooLux', 'NutriBullet'],
  books:       ['Penguin', 'Jaico', 'Piatkus', 'HarperCollins'],
};

// ── Filter panel (sidebar) ────────────────────────────────────────────
function FilterPanel({ filters, onChange, category, onClear }) {
  const [openSections, setOpenSections] = useState({ price: true, brand: true, rating: true, discount: false });

  const toggle = (key) => setOpenSections((s) => ({ ...s, [key]: !s[key] }));
  const brands = BRANDS_BY_CATEGORY[category] || [];

  return (
    <div className="card p-4 sticky top-20 space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <SlidersHorizontal size={16} />
          Filters
        </h3>
        <button onClick={onClear} className="text-xs text-primary-600 hover:underline font-medium">
          Clear all
        </button>
      </div>

      {/* Price Range */}
      <FilterSection title="Price Range" open={openSections.price} onToggle={() => toggle('price')}>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min ₹"
              value={filters.minPrice || ''}
              onChange={(e) => onChange('minPrice', e.target.value)}
              className="input text-sm"
            />
            <input
              type="number"
              placeholder="Max ₹"
              value={filters.maxPrice || ''}
              onChange={(e) => onChange('maxPrice', e.target.value)}
              className="input text-sm"
            />
          </div>
          {[
            { label: 'Under ₹500',     min: 0,    max: 500 },
            { label: '₹500 – ₹2,000',  min: 500,  max: 2000 },
            { label: '₹2,000 – ₹10,000',min:2000, max: 10000 },
            { label: 'Above ₹10,000',  min: 10000,max: '' },
          ].map(({ label, min, max }) => (
            <button
              key={label}
              onClick={() => { onChange('minPrice', min); onChange('maxPrice', max); }}
              className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${
                filters.minPrice == min && filters.maxPrice == max
                  ? 'bg-primary-100 dark:bg-primary-950/40 text-primary-700'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Brands */}
      {brands.length > 0 && (
        <FilterSection title="Brand" open={openSections.brand} onToggle={() => toggle('brand')}>
          <div className="space-y-2">
            {brands.map((brand) => (
              <label key={brand} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={(filters.brand || '').includes(brand)}
                  onChange={(e) => {
                    const current = filters.brand ? filters.brand.split(',') : [];
                    const updated = e.target.checked ? [...current, brand] : current.filter((b) => b !== brand);
                    onChange('brand', updated.join(','));
                  }}
                  className="w-4 h-4 rounded accent-primary-500"
                />
                {brand}
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Rating */}
      <FilterSection title="Customer Rating" open={openSections.rating} onToggle={() => toggle('rating')}>
        <div className="space-y-2">
          {RATING_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() => onChange('minRating', filters.minRating == r ? '' : r)}
              className={`flex items-center gap-2 w-full text-sm px-2 py-1.5 rounded-lg transition-colors ${
                filters.minRating == r
                  ? 'bg-primary-100 dark:bg-primary-950/40 text-primary-700'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-800'
              }`}
            >
              <span className="text-amber-400">{'★'.repeat(r)}</span>
              <span>{'☆'.repeat(5 - r)}</span>
              <span>& above</span>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Discount */}
      <FilterSection title="Discount" open={openSections.discount} onToggle={() => toggle('discount')}>
        <div className="space-y-2">
          {[10, 20, 30, 50].map((d) => (
            <button
              key={d}
              onClick={() => onChange('discount', filters.discount == d ? '' : d)}
              className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${
                filters.discount == d
                  ? 'bg-amber-100 text-amber-700'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-800'
              }`}
            >
              {d}% or more off
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Availability */}
      <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={filters.inStock === 'true'}
            onChange={(e) => onChange('inStock', e.target.checked ? 'true' : '')}
            className="w-4 h-4 rounded accent-primary-500"
          />
          In Stock Only
        </label>
      </div>
    </div>
  );
}

function FilterSection({ title, open, onToggle, children }) {
  return (
    <div className="filter-section">
      <button
        onClick={onToggle}
        className="filter-title w-full flex items-center justify-between"
      >
        {title}
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Category Page ─────────────────────────────────────────────────
export default function CategoryPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts]   = useState([]);
  const [isLoading, setLoading]   = useState(true);
  const [pagination, setPagination] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode]   = useState('grid');

  const filters = {
    minPrice:  searchParams.get('minPrice')  || '',
    maxPrice:  searchParams.get('maxPrice')  || '',
    brand:     searchParams.get('brand')     || '',
    minRating: searchParams.get('minRating') || '',
    discount:  searchParams.get('discount')  || '',
    inStock:   searchParams.get('inStock')   || '',
    sort:      searchParams.get('sort')      || 'newest',
    page:      searchParams.get('page')      || '1',
    search:    searchParams.get('q')         || '',
  };

  const CATEGORY_NAMES = {
    electronics: 'Electronics', fashion: 'Fashion', 'home-kitchen': 'Home & Kitchen',
    books: 'Books', sports: 'Sports', beauty: 'Beauty', search: 'Search Results',
  };

  const pageTitle = filters.search
    ? `Search: "${filters.search}"`
    : CATEGORY_NAMES[slug] || slug?.replace(/-/g, ' ');

  useEffect(() => {
    document.title = `${pageTitle} — Trove`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug, searchParams.toString()]);

  useEffect(() => {
    setLoading(true);
    const params = {
      category:  slug !== 'search' ? slug : undefined,
      search:    filters.search || undefined,
      sort:      filters.sort,
      page:      filters.page,
      limit:     20,
      minPrice:  filters.minPrice || undefined,
      maxPrice:  filters.maxPrice || undefined,
      brand:     filters.brand    || undefined,
      minRating: filters.minRating|| undefined,
      discount:  filters.discount || undefined,
      inStock:   filters.inStock  || undefined,
    };

    productAPI.getProducts(params)
      .then(({ data }) => {
        setProducts(data.data.products);
        setPagination(data.data.pagination);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [slug, searchParams.toString()]);

  const updateFilter = useCallback((key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value === '' || value === null || value === undefined) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    next.set('page', '1');
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const clearFilters = () => {
    setSearchParams({ category: slug, sort: 'newest' });
  };

  const activeFilterCount = [
    filters.minPrice, filters.maxPrice, filters.brand,
    filters.minRating, filters.discount, filters.inStock,
  ].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <button onClick={() => navigate('/')} className="hover:text-primary-600">Home</button>
        <span>/</span>
        <span className="text-gray-700 dark:text-gray-300 font-medium">{pageTitle}</span>
      </nav>

      {/* Page title + meta */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-900 dark:text-white capitalize">
            {pageTitle}
          </h1>
          {!isLoading && (
            <p className="text-sm text-gray-400 mt-1">
              {pagination.total?.toLocaleString() || 0} products found
            </p>
          )}
        </div>

        {/* Sort + view controls */}
        <div className="flex items-center gap-3">
          <select
            value={filters.sort}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className="input text-sm w-44 cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <div className="hidden md:flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-xl p-1">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}>
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}>
              <List size={16} />
            </button>
          </div>

          {/* Mobile filter button */}
          <button
            onClick={() => setShowFilters(true)}
            className="lg:hidden btn-outline flex items-center gap-2"
          >
            <SlidersHorizontal size={16} />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-primary-500 text-white rounded-full text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.brand && filters.brand.split(',').map((b) => (
            <span key={b} className="badge-primary flex items-center gap-1 px-2 py-1">
              {b}
              <button onClick={() => updateFilter('brand', filters.brand.split(',').filter((x) => x !== b).join(','))}>
                <X size={12} />
              </button>
            </span>
          ))}
          {filters.minRating && (
            <span className="badge-primary flex items-center gap-1 px-2 py-1">
              {filters.minRating}★ & above
              <button onClick={() => updateFilter('minRating', '')}><X size={12} /></button>
            </span>
          )}
          {filters.discount && (
            <span className="badge-amber flex items-center gap-1 px-2 py-1">
              {filters.discount}% off
              <button onClick={() => updateFilter('discount', '')}><X size={12} /></button>
            </span>
          )}
          {(filters.minPrice || filters.maxPrice) && (
            <span className="badge-primary flex items-center gap-1 px-2 py-1">
              ₹{filters.minPrice || '0'} – ₹{filters.maxPrice || '∞'}
              <button onClick={() => { updateFilter('minPrice', ''); updateFilter('maxPrice', ''); }}><X size={12} /></button>
            </span>
          )}
        </div>
      )}

      <div className="flex gap-6">

        {/* Desktop sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <FilterPanel
            filters={filters}
            onChange={updateFilter}
            category={slug}
            onClear={clearFilters}
          />
        </div>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="text-6xl mb-4">🔍</span>
              <h3 className="font-heading text-xl font-bold text-gray-900 dark:text-white mb-2">
                No products found
              </h3>
              <p className="text-gray-400 mb-6">Try adjusting your filters or search term</p>
              <button onClick={clearFilters} className="btn-primary">Clear filters</button>
            </div>
          ) : (
            <>
              <div className={`grid gap-4 ${
                viewMode === 'grid'
                  ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                  : 'grid-cols-1'
              }`}>
                {products.map((p) => (
                  <ProductCard key={p._id} product={p} variant={viewMode === 'list' ? 'horizontal' : 'default'} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => updateFilter('page', Number(filters.page) - 1)}
                    disabled={filters.page <= 1}
                    className="btn-outline btn-sm"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => updateFilter('page', page)}
                        className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                          page == filters.page
                            ? 'bg-primary-500 text-white'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => updateFilter('page', Number(filters.page) + 1)}
                    disabled={!pagination.hasNextPage}
                    className="btn-outline btn-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setShowFilters(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-dark-900 z-50 overflow-y-auto p-4 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Filters</h3>
                <button onClick={() => setShowFilters(false)}><X size={20} /></button>
              </div>
              <FilterPanel
                filters={filters}
                onChange={updateFilter}
                category={slug}
                onClear={() => { clearFilters(); setShowFilters(false); }}
              />
              <button onClick={() => setShowFilters(false)} className="btn-primary w-full mt-4">
                Apply Filters
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
