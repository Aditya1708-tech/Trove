import { Link } from 'react-router-dom';
import { Zap, Share2, MessageCircle, Users, PlayCircle, Mail, Phone, MapPin } from 'lucide-react';

const FOOTER_LINKS = {
  'Shop': [
    { label: 'Electronics',    href: '/category/electronics' },
    { label: 'Fashion',        href: '/category/fashion' },
    { label: 'Home & Kitchen', href: '/category/home-kitchen' },
    { label: 'Books',          href: '/category/books' },
    { label: 'Deals of the Day', href: '/?section=deals' },
  ],
  'Customer Service': [
    { label: 'Track Order',   href: '/orders' },
    { label: 'Returns & Refunds', href: '/help/returns' },
    { label: 'Shipping Policy',   href: '/help/shipping' },
    { label: 'Contact Us',        href: '/help/contact' },
    { label: 'FAQs',              href: '/help/faq' },
  ],
  'Sell on Trove': [
    { label: 'Become a Seller', href: '/seller/register' },
    { label: 'Seller Dashboard', href: '/seller' },
    { label: 'Seller Policies',  href: '/help/seller-policy' },
    { label: 'Advertise',        href: '/advertise' },
  ],
  'Company': [
    { label: 'About Trove',    href: '/about' },
    { label: 'Careers',        href: '/careers' },
    { label: 'Press',          href: '/press' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Use',   href: '/terms' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-dark-950 text-gray-300 mt-16 pb-20 lg:pb-0">
      {/* Newsletter strip */}
      <div className="bg-gradient-primary py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-heading text-2xl font-bold text-white mb-1">
              Never Miss a Deal 🔥
            </h3>
            <p className="text-primary-200 text-sm">Get exclusive offers & new arrivals directly in your inbox</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 md:w-72 px-4 py-3 rounded-xl bg-white/10 backdrop-blur border
                         border-white/20 text-white placeholder-white/50 outline-none text-sm
                         focus:bg-white/20 transition-all"
            />
            <button className="btn-amber whitespace-nowrap">Subscribe</button>
          </div>
        </div>
      </div>

      {/* Main footer links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">

          {/* Brand column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Zap size={18} className="text-white fill-white" />
              </div>
              <span className="font-heading text-xl font-bold text-white">Trove</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              India's trusted multi-category marketplace. Shop from millions of products at unbeatable prices.
            </p>
            {/* Social */}
            <div className="flex gap-3">
              {[Share2, MessageCircle, Users, PlayCircle].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-primary-600/20 flex items-center
                             justify-center text-gray-400 hover:text-primary-400 transition-all"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Link groups */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <h4 className="font-semibold text-white text-sm mb-4">{group}</h4>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      to={href}
                      className="text-sm text-gray-400 hover:text-primary-400 transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact info */}
        <div className="mt-10 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-start
                        md:items-center justify-between gap-6">
          <div className="flex flex-wrap gap-6">
            {[
              { icon: Phone, text: '+91 1800-123-4567 (Toll Free)' },
              { icon: Mail,  text: 'support@trove.com' },
              { icon: MapPin,text: 'Bengaluru, Karnataka, India' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm text-gray-400">
                <Icon size={14} className="text-primary-400" />
                {text}
              </div>
            ))}
          </div>

          {/* Payment icons */}
          <div className="flex items-center gap-2">
            {['Visa', 'MC', 'UPI', 'RuPay', 'COD'].map((method) => (
              <div
                key={method}
                className="px-2 py-1 bg-white/10 rounded text-[10px] font-bold text-gray-300"
              >
                {method}
              </div>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Trove E-Commerce Pvt. Ltd. All rights reserved. &nbsp;|&nbsp;
          Made with ❤️ in India
        </div>
      </div>
    </footer>
  );
}
