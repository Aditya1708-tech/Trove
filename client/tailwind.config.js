/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: 'var(--border)',
        // Primary — Deep Indigo / Electric Blue
        primary: {
          50:  '#eef0ff',
          100: '#e0e3ff',
          200: '#c7ccff',
          300: '#a5acff',
          400: '#7e82fa',
          500: '#4E4FEB',
          600: '#3B3CD4',
          700: '#2A2A72',  // deep indigo
          800: '#1e1e5c',
          900: '#141445',
          950: '#0c0c2e',
        },
        // CTA / Deals — Warm Amber
        amber: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#FFB100',   // brand amber
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Success
        success: {
          50:  '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        // Error
        error: {
          50:  '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
        // Neutral (dark mode backgrounds)
        dark: {
          800: '#1a1a2e',
          900: '#0f0f1a',
          950: '#080812',
        },
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body:    ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card':    '0 2px 12px rgba(0,0,0,0.08)',
        'card-lg': '0 8px 30px rgba(0,0,0,0.12)',
        'glow':    '0 0 20px rgba(78,79,235,0.35)',
        'amber':   '0 0 20px rgba(255,177,0,0.4)',
      },
      animation: {
        'fade-up':    'fadeUp 0.4s ease-out',
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-in':   'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-sm':  'bounceSm 1s infinite',
        'shimmer':    'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeUp:   { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn:  { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        bounceSm: { '0%,100%': { transform: 'translateY(-4px)' }, '50%': { transform: 'translateY(0)' } },
        shimmer:  { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #2A2A72 0%, #4E4FEB 100%)',
        'gradient-amber':   'linear-gradient(135deg, #FFB100 0%, #ff6b00 100%)',
        'gradient-hero':    'linear-gradient(135deg, #0c0c2e 0%, #2A2A72 50%, #4E4FEB 100%)',
        'shimmer-gradient': 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
      },
      screens: {
        'xs': '480px',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
  plugins: [],
}
