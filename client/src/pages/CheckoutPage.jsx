import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Plus, MapPin, CreditCard, Truck, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { orderAPI, userAPI } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STEPS = ['Address', 'Order Summary', 'Payment'];

const PAYMENT_METHODS = [
  { id: 'razorpay', label: 'Online Payment', sub: 'Cards, UPI, Net Banking, Wallets', icon: '💳', default: true },
  { id: 'cod',      label: 'Cash on Delivery', sub: 'Pay when your order arrives', icon: '💵' },
];

function AddressForm({ onSave, onCancel, initial = {} }) {
  const [form, setForm] = useState({
    fullName: initial.fullName || '',
    phone:    initial.phone    || '',
    addressLine1: initial.addressLine1 || '',
    addressLine2: initial.addressLine2 || '',
    city:     initial.city     || '',
    state:    initial.state    || '',
    pincode:  initial.pincode  || '',
    type:     initial.type     || 'home',
    isDefault: initial.isDefault || false,
    ...initial,
  });

  const STATES = ['Andhra Pradesh','Assam','Bihar','Delhi','Gujarat','Haryana','Karnataka',
    'Kerala','Madhya Pradesh','Maharashtra','Punjab','Rajasthan','Tamil Nadu','Telangana',
    'Uttar Pradesh','West Bengal','Other'];

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.fullName || !form.phone || !form.addressLine1 || !form.city || !form.state || !form.pincode) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!/^\d{6}$/.test(form.pincode)) { toast.error('Enter valid 6-digit pincode'); return; }
    if (!/^\d{10}$/.test(form.phone))  { toast.error('Enter valid 10-digit phone'); return; }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Full Name *</label>
          <input className="input" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="John Doe" />
        </div>
        <div>
          <label className="label">Phone *</label>
          <input className="input" value={form.phone} onChange={(e) => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile" />
        </div>
      </div>
      <div>
        <label className="label">Address Line 1 *</label>
        <input className="input" value={form.addressLine1} onChange={(e) => update('addressLine1', e.target.value)} placeholder="House/Flat No., Street, Area" />
      </div>
      <div>
        <label className="label">Address Line 2</label>
        <input className="input" value={form.addressLine2} onChange={(e) => update('addressLine2', e.target.value)} placeholder="Landmark (optional)" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label className="label">City *</label>
          <input className="input" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="City" />
        </div>
        <div>
          <label className="label">Pincode *</label>
          <input className="input" value={form.pincode} onChange={(e) => update('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6 digits" />
        </div>
      </div>
      <div>
        <label className="label">State *</label>
        <select className="input" value={form.state} onChange={(e) => update('state', e.target.value)}>
          <option value="">Select State</option>
          {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-4">
        {['home', 'work', 'other'].map((t) => (
          <label key={t} className="flex items-center gap-1.5 text-sm cursor-pointer capitalize">
            <input type="radio" name="type" value={t} checked={form.type === t} onChange={() => update('type', t)} className="accent-primary-500" />
            {t}
          </label>
        ))}
        <label className="flex items-center gap-1.5 text-sm cursor-pointer ml-auto">
          <input type="checkbox" checked={form.isDefault} onChange={(e) => update('isDefault', e.target.checked)} className="accent-primary-500" />
          Set as default
        </label>
      </div>
      <div className="flex gap-3">
        <button type="submit" className="btn-primary flex-1">Save Address</button>
        {onCancel && <button type="button" onClick={onCancel} className="btn-ghost flex-1">Cancel</button>}
      </div>
    </form>
  );
}

export default function CheckoutPage() {
  const { items, total, shippingCharges, savings, appliedCoupon, fetchCart } = useCart();
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]             = useState(0);
  const [addresses, setAddresses]   = useState([]);
  const [selectedAddr, setSelectedAddr] = useState(null);
  const [showAddForm, setShowAddForm]   = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [placing, setPlacing]       = useState(false);

  useEffect(() => {
    document.title = 'Checkout — Trove';
    if (!isLoggedIn) { navigate('/login?redirect=/checkout'); return; }
    if (items.length === 0) { navigate('/cart'); return; }

    userAPI.getAddresses().then(({ data }) => {
      const addrs = data.data.addresses || [];
      setAddresses(addrs);
      setSelectedAddr(addrs.find((a) => a.isDefault) || addrs[0] || null);
    }).catch(() => {});
  }, [isLoggedIn, items.length]);

  const handleSaveAddress = async (formData) => {
    try {
      const { data } = await userAPI.addAddress(formData);
      const newAddr = data.data.address;
      setAddresses((prev) => [...prev, newAddr]);
      setSelectedAddr(newAddr);
      setShowAddForm(false);
      toast.success('Address saved!');
    } catch { toast.error('Failed to save address'); }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddr) { toast.error('Select a delivery address'); return; }
    setPlacing(true);

    try {
      const orderData = {
        addressId: selectedAddr._id,
        paymentMethod,
        couponCode: appliedCoupon?.code,
        items: items.map((i) => ({
          product: i.product._id,
          variantId: i.variantId,
          quantity: i.quantity,
          price: i.price,
        })),
      };

      const { data } = await orderAPI.createOrder(orderData);

      if (paymentMethod === 'cod') {
        toast.success('Order placed successfully! 🎉', { duration: 5000 });
        navigate(`/orders/${data.data.order._id}`);
        return;
      }

      // Razorpay flow
      const rpOrder = data.data.razorpay;
      const options = {
        key:          import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount:       rpOrder.amount,
        currency:     rpOrder.currency,
        name:         'Trove',
        description:  'Order Payment',
        order_id:     rpOrder.orderId,
        prefill: {
          name:  user?.name,
          email: user?.email,
          contact: selectedAddr.phone,
        },
        theme: { color: '#4E4FEB' },
        handler: async (response) => {
          try {
            await orderAPI.verifyPayment({
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderId: data.data.order._id,
            });
            toast.success('Payment successful! 🎉', { duration: 5000 });
            await fetchCart();
            navigate(`/orders/${data.data.order._id}`);
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        modal: {
          ondismiss: () => toast('Payment cancelled', { icon: '⚠️' }),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  const couponSavings = appliedCoupon?.discount || 0;
  const finalTotal = Math.max(0, (total - couponSavings) + shippingCharges);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6">
      <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white mb-6">Checkout</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all ${
              i < step ? 'bg-green-500 text-white' : i === step ? 'bg-primary-500 text-white' : 'bg-gray-200 dark:bg-dark-700 text-gray-500'
            }`}>
              {i < step ? <CheckCircle size={16} /> : i + 1}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${i === step ? 'text-primary-600' : 'text-gray-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 w-8 ${i < step ? 'bg-green-400' : 'bg-gray-200 dark:bg-dark-700'}`} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">

          {/* Step 0: Address */}
          <div className="card">
            <button
              className="w-full flex items-center justify-between p-5"
              onClick={() => setStep(step === 0 ? -1 : 0)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 0 ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'}`}>
                  <MapPin size={16} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">Delivery Address</p>
                  {selectedAddr && step !== 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {selectedAddr.fullName} — {selectedAddr.city}, {selectedAddr.state} {selectedAddr.pincode}
                    </p>
                  )}
                </div>
              </div>
              {step === 0 ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>

            <AnimatePresence>
              {step === 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                    {addresses.map((addr) => (
                      <label key={addr._id} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedAddr?._id === addr._id ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20' : 'border-gray-200 dark:border-gray-700'
                      }`}>
                        <input type="radio" name="address" checked={selectedAddr?._id === addr._id} onChange={() => setSelectedAddr(addr)} className="mt-0.5 accent-primary-500" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{addr.fullName}</span>
                            <span className="badge-primary capitalize text-[10px]">{addr.type}</span>
                            {addr.isDefault && <span className="badge-success text-[10px]">Default</span>}
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} — {addr.pincode}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">📞 {addr.phone}</p>
                        </div>
                      </label>
                    ))}

                    {showAddForm ? (
                      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                        <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-4">New Address</h4>
                        <AddressForm onSave={handleSaveAddress} onCancel={() => setShowAddForm(false)} />
                      </div>
                    ) : (
                      <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 text-primary-600 text-sm font-semibold border-2 border-dashed border-primary-200 rounded-xl p-4 w-full hover:bg-primary-50 transition-colors">
                        <Plus size={16} /> Add New Address
                      </button>
                    )}

                    {selectedAddr && !showAddForm && (
                      <button onClick={() => setStep(1)} className="btn-primary w-full">
                        Deliver to this address
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Step 1: Order summary */}
          <div className="card">
            <button className="w-full flex items-center justify-between p-5" onClick={() => setStep(step === 1 ? -1 : 1)}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'}`}>
                  <Truck size={16} />
                </div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Order Summary ({items.length} items)</p>
              </div>
              {step === 1 ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>

            <AnimatePresence>
              {step === 1 && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 space-y-4">
                    {items.map((item) => {
                      const variant = item.product?.variants?.find((v) => v._id?.toString() === item.variantId?.toString()) || item.product?.variants?.[0];
                      return (
                        <div key={item._id} className="flex gap-3">
                          <img src={item.product?.images?.[0]?.url || 'https://placehold.co/60x60'} alt={item.product?.name} className="w-14 h-14 rounded-xl object-contain bg-gray-50 border border-gray-100" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate-2 leading-snug">{item.product?.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity} {variant?.color ? `• ${variant.color}` : ''} {variant?.size ? `• ${variant.size}` : ''}</p>
                          </div>
                          <p className="font-bold text-sm text-gray-900 dark:text-white">₹{(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      );
                    })}
                    <button onClick={() => setStep(2)} className="btn-primary w-full">Continue to Payment</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Step 2: Payment */}
          <div className="card">
            <button className="w-full flex items-center justify-between p-5" onClick={() => setStep(step === 2 ? -1 : 2)}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'}`}>
                  <CreditCard size={16} />
                </div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Payment Method</p>
              </div>
              {step === 2 ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>

            <AnimatePresence>
              {step === 2 && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 space-y-3">
                    {PAYMENT_METHODS.map((pm) => (
                      <label key={pm.id} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === pm.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20' : 'border-gray-200 dark:border-gray-700'
                      }`}>
                        <input type="radio" name="payment" checked={paymentMethod === pm.id} onChange={() => setPaymentMethod(pm.id)} className="accent-primary-500" />
                        <span className="text-2xl">{pm.icon}</span>
                        <div>
                          <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{pm.label}</p>
                          <p className="text-xs text-gray-400">{pm.sub}</p>
                        </div>
                      </label>
                    ))}

                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                      <Shield size={13} className="text-green-500" />
                      All transactions are secured with 256-bit SSL encryption
                    </div>

                    <button
                      onClick={handlePlaceOrder}
                      disabled={placing}
                      className="btn-amber btn-lg w-full"
                    >
                      {placing ? (
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        `Place Order — ₹${finalTotal.toLocaleString()}`
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Price summary sidebar */}
        <div className="card p-5 space-y-3 h-fit sticky top-20">
          <h3 className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
            Price Summary
          </h3>
          <div className="space-y-2 text-sm">
            {[
              { label: `Items (${items.length})`, value: `₹${(total + savings).toLocaleString()}` },
              { label: 'Discount',     value: `−₹${savings.toLocaleString()}`, cls: 'text-green-600' },
              ...(couponSavings > 0 ? [{ label: `Coupon (${appliedCoupon.code})`, value: `−₹${couponSavings.toLocaleString()}`, cls: 'text-green-600' }] : []),
              { label: 'Delivery',     value: shippingCharges === 0 ? 'FREE' : `₹${shippingCharges}`, cls: shippingCharges === 0 ? 'text-green-600 font-semibold' : '' },
            ].map(({ label, value, cls }) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-500">{label}</span>
                <span className={cls || 'text-gray-800 dark:text-gray-200'}>{value}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-gray-100 dark:border-gray-800 pt-2 font-bold text-base text-gray-900 dark:text-white">
              <span>Total</span>
              <span>₹{finalTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
