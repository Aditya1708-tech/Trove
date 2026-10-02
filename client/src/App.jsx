import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { useAuth } from './context/AuthContext';

// Lazy-loaded pages
const HomePage          = lazy(() => import('./pages/HomePage'));
const CategoryPage      = lazy(() => import('./pages/CategoryPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage          = lazy(() => import('./pages/CartPage'));
const CheckoutPage      = lazy(() => import('./pages/CheckoutPage'));
const OrderDetailPage   = lazy(() => import('./pages/OrderDetailPage'));
const OrdersPage        = lazy(() => import('./pages/OrdersPage'));
const AuthPage          = lazy(() => import('./pages/AuthPage'));
const WishlistPage      = lazy(() => import('./pages/WishlistPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));

// Page loader
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
        <p className="text-sm text-gray-400 animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { isLoggedIn, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, isLoggedIn, isLoading } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!isLoggedIn) return <Navigate to="/login?redirect=/admin" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

// Layout for public pages (with Navbar + Footer)
function PublicLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <>
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            background:   '#fff',
            color:        '#111827',
            boxShadow:    '0 4px 20px rgba(0,0,0,0.1)',
            fontSize:     '14px',
            fontFamily:   '"Inter", sans-serif',
            padding:      '12px 16px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Auth routes (no navbar/footer) */}
          <Route path="/login"    element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />

          {/* Checkout (no footer — cleaner UX) */}
          <Route path="/checkout" element={
            <ProtectedRoute>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-1">
                  <CheckoutPage />
                </main>
              </div>
            </ProtectedRoute>
          } />

          <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />

          {/* Main layout routes */}
          <Route path="/*" element={
            <PublicLayout>
              <Routes>
                <Route index element={<HomePage />} />

                {/* Category / Search */}
                <Route path="category/:slug" element={<CategoryPage />} />
                <Route path="search"         element={<CategoryPage />} />

                {/* Product */}
                <Route path="product/:slug"  element={<ProductDetailPage />} />

                {/* Cart */}
                <Route path="cart"           element={<CartPage />} />

                {/* Protected routes */}
                <Route path="orders" element={
                  <ProtectedRoute><OrdersPage /></ProtectedRoute>
                } />
                <Route path="orders/:id" element={
                  <ProtectedRoute><OrderDetailPage /></ProtectedRoute>
                } />
                <Route path="wishlist" element={
                  <ProtectedRoute><WishlistPage /></ProtectedRoute>
                } />

                {/* Catch-all 404 */}
                <Route path="*" element={
                  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                    <span className="text-8xl font-bold text-gradient-primary mb-4">404</span>
                    <h2 className="font-heading text-2xl font-bold text-gray-900 dark:text-white mb-2">Page not found</h2>
                    <p className="text-gray-400 mb-6">The page you're looking for doesn't exist</p>
                    <a href="/" className="btn-primary">Go Home</a>
                  </div>
                } />
              </Routes>
            </PublicLayout>
          } />
        </Routes>
      </Suspense>
    </>
  );
}
