/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0f1419',
        'glass': 'rgba(255, 255, 255, 0.1)',
        'accent': '#00d4ff',
        'primary': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      fontFamily: {
        'sans': ['var(--font-family)', 'Inter', 'system-ui', 'sans-serif'],
        'inter': ['Inter', 'system-ui', 'sans-serif'],
        'heebo': ['Heebo', 'system-ui', 'sans-serif'],
        'arabic': ['Noto Sans Arabic', 'system-ui', 'sans-serif'],
        'roboto': ['Roboto', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-subtle': 'bounceSubtle 0.6s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
    },
  },
  plugins: [
    // RTL/LTR support plugin
    function({ addUtilities, addBase, theme }) {
      // Base styles for RTL/LTR support
      addBase({
        ':root': {
          '--font-family': 'Inter',
        },
        '.lang-he': {
          '--font-family': 'Heebo',
        },
        '.lang-ar': {
          '--font-family': 'Noto Sans Arabic',
        },
        '.lang-en': {
          '--font-family': 'Inter',
        },
        '.lang-es': {
          '--font-family': 'Inter',
        },
        // RTL-specific styles
        '.dir-rtl': {
          direction: 'rtl',
        },
        '.dir-ltr': {
          direction: 'ltr',
        },
      });

      // RTL/LTR utilities
      addUtilities({
        // Margin utilities that respect direction
        '.ms-auto': {
          'margin-inline-start': 'auto',
        },
        '.me-auto': {
          'margin-inline-end': 'auto',
        },
        '.mx-auto': {
          'margin-inline': 'auto',
        },
        
        // Padding utilities
        '.ps-4': {
          'padding-inline-start': theme('spacing.4'),
        },
        '.pe-4': {
          'padding-inline-end': theme('spacing.4'),
        },
        '.ps-6': {
          'padding-inline-start': theme('spacing.6'),
        },
        '.pe-6': {
          'padding-inline-end': theme('spacing.6'),
        },
        
        // Text alignment
        '.text-start': {
          'text-align': 'start',
        },
        '.text-end': {
          'text-align': 'end',
        },
        
        // Border utilities
        '.border-s': {
          'border-inline-start-width': '1px',
        },
        '.border-e': {
          'border-inline-end-width': '1px',
        },
        
        // Transform utilities for RTL icons
        '.rtl\\:rotate-180': {
          '.dir-rtl &': {
            transform: 'rotate(180deg)',
          },
        },
        '.rtl\\:scale-x-[-1]': {
          '.dir-rtl &': {
            transform: 'scaleX(-1)',
          },
        },
        
        // Flex utilities
        '.flex-row-reverse-rtl': {
          '.dir-rtl &': {
            'flex-direction': 'row-reverse',
          },
        },
      });
    },
  ],
}