import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';

export default function WishlistPage() {
  const { items, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { isLoggedIn } = useAuth();

  useEffect(() => { document.title = 'My Wishlist — Trove'; }, []);

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Heart size={64} className="text-gray-200 dark:text-gray-700 mb-4" />
        <h2 className="font-heading text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign in to view your wishlist</h2>
        <p className="text-gray-400 mb-6">Save items you love and access them anytime</p>
        <Link to="/login?redirect=/wishlist" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Heart size={72} className="text-rose-200 dark:text-rose-900 mb-4 mx-auto" />
        </motion.div>
        <h2 className="font-heading text-2xl font-bold text-gray-900 dark:text-white mb-2">Your wishlist is empty</h2>
        <p className="text-gray-400 mb-6">Save items you like and they'll show up here</p>
        <Link to="/" className="btn-primary">Discover Products</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6">
      <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
        <Heart size={26} className="text-rose-500 fill-rose-500" />
        My Wishlist
        <span className="text-lg font-normal text-gray-400">({items.length} items)</span>
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((product, i) => (
          <motion.div key={product._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <ProductCard product={product} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
