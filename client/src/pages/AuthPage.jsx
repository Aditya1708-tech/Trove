import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Phone, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { authAPI } from '../api';

function OtpInput({ length = 6, onComplete }) {
  const [otp, setOtp] = useState(Array(length).fill(''));
  const inputs = [];

  const handle = (i, val) => {
    if (isNaN(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < length - 1) inputs[i + 1]?.focus();
    const complete = next.join('');
    if (complete.length === length) onComplete(complete);
  };

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputs[i - 1]?.focus();
  };

  return (
    <div className="flex gap-3 justify-center">
      {otp.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (inputs[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handle(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          className="w-11 h-12 text-center font-bold text-xl rounded-xl border-2 border-gray-200 dark:border-gray-700
                     bg-white dark:bg-dark-800 text-gray-900 dark:text-white outline-none
                     focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
        />
      ))}
    </div>
  );
}

export default function AuthPage({ mode: defaultMode = 'login' }) {
  const [mode, setMode] = useState(defaultMode); // 'login' | 'register' | 'otp'
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [isLoading, setLoading] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpResendTimer, setOtpResendTimer] = useState(0);

  const { login, register, loginWithOtp, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  useEffect(() => {
    if (isLoggedIn) navigate(redirect, { replace: true });
  }, [isLoggedIn]);

  useEffect(() => {
    document.title = mode === 'register' ? 'Create Account — Trove' : 'Sign In — Trove';
  }, [mode]);

  useEffect(() => {
    if (otpResendTimer > 0) {
      const id = setInterval(() => setOtpResendTimer((t) => t - 1), 1000);
      return () => clearInterval(id);
    }
  }, [otpResendTimer]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Fill in all fields'); return; }
    setLoading(true);
    try {
      await login({ email: form.email, password: form.password });
      toast.success('Welcome back! 👋');
      navigate(redirect, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error('Fill in all required fields'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, phone: form.phone });
      toast.success('Account created! 🎉');
      navigate(redirect, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  const handleSendOtp = async () => {
    if (!form.email) { toast.error('Enter your email first'); return; }
    setLoading(true);
    try {
      await authAPI.sendOtp(form.email);
      setOtpEmail(form.email);
      setMode('otp');
      setOtpResendTimer(60);
      toast.success('OTP sent to your email');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const handleOtpComplete = async (otp) => {
    setLoading(true);
    try {
      await loginWithOtp(otpEmail, otp);
      toast.success('Welcome! 🎉');
      navigate(redirect, { replace: true });
    } catch {
      toast.error('Invalid or expired OTP');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left visual panel (desktop) */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-hero items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="relative z-10 text-center px-12">
          <Link to="/" className="flex items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Zap size={28} className="text-white fill-white" />
            </div>
            <span className="font-heading text-4xl font-bold text-white">Trove</span>
          </Link>
          <h2 className="font-heading text-3xl font-bold text-white mb-4 leading-tight">
            India's Favourite<br />Shopping Destination
          </h2>
          <p className="text-white/70 text-lg">Millions of products. Unbeatable prices.</p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { icon: '📦', stat: '10M+', label: 'Products' },
              { icon: '🏪', stat: '50K+', label: 'Sellers' },
              { icon: '😊', stat: '5M+',  label: 'Happy Customers' },
              { icon: '🚚', stat: '500+', label: 'Cities' },
            ].map(({ icon, stat, label }) => (
              <div key={label} className="bg-white/10 rounded-2xl p-4 text-center">
                <div className="text-2xl">{icon}</div>
                <div className="font-bold text-white text-xl mt-1">{stat}</div>
                <div className="text-white/60 text-xs">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white dark:bg-dark-900 min-h-screen">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <Link to="/" className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-gradient-primary rounded-xl flex items-center justify-center">
              <Zap size={20} className="text-white fill-white" />
            </div>
            <span className="font-heading text-2xl font-bold text-gradient-primary">Trove</span>
          </Link>

          {mode === 'otp' ? (
            <>
              <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                Enter OTP
              </h1>
              <p className="text-gray-500 text-center mb-8">
                We've sent a 6-digit code to <strong>{otpEmail}</strong>
              </p>
              <OtpInput length={6} onComplete={handleOtpComplete} />
              {isLoading && (
                <p className="text-center mt-6 text-sm text-gray-400">Verifying...</p>
              )}
              <div className="text-center mt-6">
                {otpResendTimer > 0 ? (
                  <p className="text-sm text-gray-400">Resend OTP in {otpResendTimer}s</p>
                ) : (
                  <button onClick={handleSendOtp} className="text-sm text-primary-600 font-semibold hover:underline">
                    Resend OTP
                  </button>
                )}
              </div>
              <button onClick={() => setMode('login')} className="btn-ghost w-full mt-4">← Back to Login</button>
            </>
          ) : (
            <>
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {mode === 'register' ? 'Create your account' : 'Welcome back'}
              </h1>
              <p className="text-gray-500 mb-8">
                {mode === 'register' ? 'Join millions of happy shoppers' : 'Sign in to continue to Trove'}
              </p>

              <form onSubmit={mode === 'register' ? handleRegister : handleLogin} className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <label className="label">Full Name *</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input className="input pl-9" placeholder="John Doe" value={form.name} onChange={(e) => update('name', e.target.value)} />
                    </div>
                  </div>
                )}

                <div>
                  <label className="label">Email Address *</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="email" className="input pl-9" placeholder="you@example.com" value={form.email} onChange={(e) => update('email', e.target.value)} />
                  </div>
                </div>

                {mode === 'register' && (
                  <div>
                    <label className="label">Phone (optional)</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="tel" className="input pl-9" placeholder="10-digit mobile number" value={form.phone} onChange={(e) => update('phone', e.target.value.replace(/\D/g,'').slice(0,10))} />
                    </div>
                  </div>
                )}

                <div>
                  <label className="label">Password *</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      className="input pl-9 pr-10"
                      placeholder={mode === 'register' ? 'Min. 6 characters' : 'Your password'}
                      value={form.password}
                      onChange={(e) => update('password', e.target.value)}
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPw(!showPw)}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {mode === 'login' && (
                  <div className="flex justify-end">
                    <button type="button" className="text-sm text-primary-600 hover:underline">Forgot password?</button>
                  </div>
                )}

                <button type="submit" disabled={isLoading} className="btn-primary btn-lg w-full">
                  {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : mode === 'register' ? 'Create Account' : 'Sign In'}
                </button>

                {mode === 'login' && (
                  <>
                    <div className="flex items-center gap-3 my-1">
                      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                      <span className="text-xs text-gray-400">or</span>
                      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isLoading}
                      className="btn-outline w-full flex items-center gap-2"
                    >
                      <Mail size={16} /> Login with OTP
                    </button>
                  </>
                )}
              </form>

              <p className="text-center mt-6 text-sm text-gray-500">
                {mode === 'register' ? (
                  <>Already have an account?{' '}
                    <button onClick={() => setMode('login')} className="text-primary-600 font-semibold hover:underline">Sign in</button>
                  </>
                ) : (
                  <>New to Trove?{' '}
                    <button onClick={() => setMode('register')} className="text-primary-600 font-semibold hover:underline">Create account</button>
                  </>
                )}
              </p>

              {mode === 'register' && (
                <p className="text-center text-xs text-gray-400 mt-4">
                  By creating an account, you agree to our{' '}
                  <Link to="/terms" className="text-primary-600 hover:underline">Terms of Service</Link> and{' '}
                  <Link to="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>
                </p>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
