import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { cartAPI } from '../api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

const initialState = {
  items:          [],
  savedItems:     [],
  itemsTotal:     0,
  mrpTotal:       0,
  savings:        0,
  shippingCharges:0,
  total:          0,
  appliedCoupon:  null,
  itemCount:      0,
  isLoading:      false,
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'SET_CART': {
      const cart = action.payload;
      const activeItems = (cart.items || []).filter((i) => !i.isSavedForLater);
      const savedItems  = (cart.items || []).filter((i) => i.isSavedForLater);
      return {
        ...state,
        items:           activeItems,
        savedItems,
        itemsTotal:      cart.itemsTotal || 0,
        mrpTotal:        cart.mrpTotal   || 0,
        savings:         cart.savings    || 0,
        shippingCharges: cart.shippingCharges || 0,
        total:           cart.total      || 0,
        appliedCoupon:   cart.appliedCoupon || null,
        itemCount:       activeItems.length,
        isLoading:       false,
      };
    }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ITEM_COUNT':
      return { ...state, itemCount: action.payload };
    case 'CLEAR_CART':
      return { ...initialState };
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isLoggedIn } = useAuth();

  // Fetch cart from server (or guest cart)
  const fetchCart = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const { data } = await cartAPI.getCart();
      dispatch({ type: 'SET_CART', payload: data.data.cart });
    } catch {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  useEffect(() => {
    // Ensure guest session ID exists
    if (!localStorage.getItem('sessionId')) {
      localStorage.setItem('sessionId', `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    }
    fetchCart();
  }, [fetchCart, isLoggedIn]);

  const addToCart = useCallback(async (productId, variantId, quantity = 1) => {
    try {
      await cartAPI.addToCart({ productId, variantId, quantity });
      toast.success('Added to cart!', { icon: '🛒' });
      await fetchCart();
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add to cart';
      toast.error(msg);
      return false;
    }
  }, [fetchCart]);

  const updateItem = useCallback(async (itemId, quantity) => {
    try {
      await cartAPI.updateCartItem({ itemId, quantity });
      await fetchCart();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  }, [fetchCart]);

  const removeItem = useCallback(async (itemId) => {
    try {
      await cartAPI.removeFromCart(itemId);
      toast.success('Item removed');
      await fetchCart();
    } catch {
      toast.error('Failed to remove item');
    }
  }, [fetchCart]);

  const saveForLater = useCallback(async (itemId) => {
    try {
      const { data } = await cartAPI.saveForLater(itemId);
      toast.success(data.message);
      await fetchCart();
    } catch {
      toast.error('Action failed');
    }
  }, [fetchCart]);

  const applyCoupon = useCallback(async (code) => {
    try {
      const { data } = await cartAPI.applyCoupon(code);
      toast.success(data.message, { icon: '🎟️' });
      await fetchCart();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
      return false;
    }
  }, [fetchCart]);

  const removeCoupon = useCallback(async () => {
    try {
      await cartAPI.removeCoupon();
      await fetchCart();
    } catch {}
  }, [fetchCart]);

  return (
    <CartContext.Provider value={{
      ...state,
      fetchCart,
      addToCart,
      updateItem,
      removeItem,
      saveForLater,
      applyCoupon,
      removeCoupon,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
