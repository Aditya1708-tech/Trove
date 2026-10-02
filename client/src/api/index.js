import api from './axiosInstance';

// ── Auth ───────────────────────────────────────────────────────────
export const authAPI = {
  register:      (data)         => api.post('/auth/register', data),
  login:         (data)         => api.post('/auth/login', data),
  sendOtp:       (email)        => api.post('/auth/send-otp', { email }),
  verifyOtp:     (data)         => api.post('/auth/verify-otp', data),
  refresh:       ()             => api.post('/auth/refresh'),
  logout:        ()             => api.post('/auth/logout'),
  getMe:         ()             => api.get('/auth/me'),
  updateMe:      (data)         => api.patch('/auth/me', data),
  changePassword:(data)         => api.patch('/auth/change-password', data),
};

// ── Products ───────────────────────────────────────────────────────
export const productAPI = {
  getProducts:      (params)    => api.get('/products', { params }),
  getProductBySlug: (slug)      => api.get(`/products/${slug}`),
  getSimilarProducts:(id)       => api.get(`/products/${id}/similar`),
  autocomplete:     (q)         => api.get('/products/search/autocomplete', { params: { q } }),
  deliveryEstimate: (pincode)   => api.get('/products/pincode-estimate', { params: { pincode } }),
  createProduct:    (formData)  => api.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateProduct:    (id, data)  => api.patch(`/products/${id}`, data),
  deleteProduct:    (id)        => api.delete(`/products/${id}`),
};

// ── Cart ───────────────────────────────────────────────────────────
export const cartAPI = {
  getCart:         ()           => api.get('/cart'),
  addToCart:       (data)       => api.post('/cart/add', data),
  updateCartItem:  (data)       => api.patch('/cart/update', data),
  removeFromCart:  (itemId)     => api.delete(`/cart/${itemId}`),
  saveForLater:    (itemId)     => api.patch(`/cart/${itemId}/save-for-later`),
  applyCoupon:     (code)       => api.post('/cart/apply-coupon', { code }),
  removeCoupon:    ()           => api.delete('/cart/coupon'),
};

// ── Orders ─────────────────────────────────────────────────────────
export const orderAPI = {
  createOrder:     (data)       => api.post('/orders', data),
  verifyPayment:   (data)       => api.post('/orders/verify-payment', data),
  getMyOrders:     (params)     => api.get('/orders/my', { params }),
  getOrderById:    (id)         => api.get(`/orders/${id}`),
  cancelOrder:     (id, reason) => api.post(`/orders/${id}/cancel`, { reason }),
};

// ── Users ──────────────────────────────────────────────────────────
export const userAPI = {
  getWishlist:     ()           => api.get('/users/wishlist'),
  toggleWishlist:  (productId)  => api.post(`/users/wishlist/${productId}`),
  getAddresses:    ()           => api.get('/users/addresses'),
  addAddress:      (data)       => api.post('/users/addresses', data),
  updateAddress:   (id, data)   => api.patch(`/users/addresses/${id}`, data),
  deleteAddress:   (id)         => api.delete(`/users/addresses/${id}`),
};

// ── Reviews ────────────────────────────────────────────────────────
export const reviewAPI = {
  getProductReviews: (productId, params) => api.get(`/products/${productId}/reviews`, { params }),
  addReview:         (productId, formData) => api.post(`/products/${productId}/reviews`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  markHelpful:       (id)       => api.post(`/users/reviews/${id}/helpful`),
  deleteReview:      (id)       => api.delete(`/users/reviews/${id}`),
};

// ── Admin ──────────────────────────────────────────────────────────
export const adminAPI = {
  getDashboard:    ()           => api.get('/admin/dashboard'),
  getLowStock:     (threshold)  => api.get('/admin/low-stock', { params: { threshold } }),
  getProducts:     (params)     => api.get('/admin/products', { params }),

  // Categories
  getCategories:   ()           => api.get('/admin/categories'),
  createCategory:  (data)       => api.post('/admin/categories', data),
  updateCategory:  (id, data)   => api.patch(`/admin/categories/${id}`, data),
  deleteCategory:  (id)         => api.delete(`/admin/categories/${id}`),

  // Coupons
  getCoupons:      ()           => api.get('/admin/coupons'),
  createCoupon:    (data)       => api.post('/admin/coupons', data),
  updateCoupon:    (id, data)   => api.patch(`/admin/coupons/${id}`, data),
  deleteCoupon:    (id)         => api.delete(`/admin/coupons/${id}`),

  // Banners
  getBanners:      (pos)        => api.get('/admin/banners', { params: { position: pos } }),
  createBanner:    (data)       => api.post('/admin/banners', data),
  updateBanner:    (id, data)   => api.patch(`/admin/banners/${id}`, data),
  deleteBanner:    (id)         => api.delete(`/admin/banners/${id}`),

  // Orders
  getAllOrders:    (params)     => api.get('/orders/admin/all', { params }),
  updateOrderStatus:(id, data) => api.patch(`/orders/${id}/status`, data),

  // Users
  getAllUsers:     (params)    => api.get('/users', { params }),
  toggleUserStatus:(id)       => api.patch(`/users/${id}/toggle-status`),
};

// ── Public (categories, banners) ───────────────────────────────────
export const publicAPI = {
  getCategories: () => api.get('/admin/categories'),
  getBanners:    (pos) => api.get('/admin/banners', { params: { position: pos } }),
};
