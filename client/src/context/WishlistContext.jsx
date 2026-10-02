import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { userAPI } from '../api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WishlistContext = createContext(null);

function wishlistReducer(state, action) {
  switch (action.type) {
    case 'SET_WISHLIST':
      return { ...state, items: action.payload, ids: new Set(action.payload.map((p) => p._id)) };
    case 'ADD':
      return { ...state, ids: new Set([...state.ids, action.payload]) };
    case 'REMOVE':
      return { ...state, ids: new Set([...state.ids].filter((id) => id !== action.payload)) };
    default:
      return state;
  }
}

export function WishlistProvider({ children }) {
  const [state, dispatch] = useReducer(wishlistReducer, { items: [], ids: new Set() });
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn) {
      userAPI.getWishlist()
        .then(({ data }) => dispatch({ type: 'SET_WISHLIST', payload: data.data.wishlist }))
        .catch(() => {});
    } else {
      dispatch({ type: 'SET_WISHLIST', payload: [] });
    }
  }, [isLoggedIn]);

  const toggleWishlist = useCallback(async (productId) => {
    if (!isLoggedIn) {
      toast('Please login to save to wishlist', { icon: '❤️' });
      return false;
    }

    const wasInWishlist = state.ids.has(productId);
    // Optimistic update
    dispatch({ type: wasInWishlist ? 'REMOVE' : 'ADD', payload: productId });

    try {
      const { data } = await userAPI.toggleWishlist(productId);
      toast(data.message, { icon: data.data.inWishlist ? '❤️' : '🤍' });
      return data.data.inWishlist;
    } catch {
      // Revert optimistic update on error
      dispatch({ type: wasInWishlist ? 'ADD' : 'REMOVE', payload: productId });
      toast.error('Action failed');
      return wasInWishlist;
    }
  }, [isLoggedIn, state.ids]);

  const isInWishlist = useCallback((productId) => state.ids.has(productId), [state.ids]);

  return (
    <WishlistContext.Provider value={{ items: state.items, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider');
  return ctx;
};
