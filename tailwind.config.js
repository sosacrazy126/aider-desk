const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        background: {
          DEFAULT: '#0a0a0a',
          dark: '#060606',
          light: '#1a1a1a',
        },
        primary: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
        },
        secondary: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
        },
        neutral: {
          50: '#f8f9fa',    // Lightest, almost white
          100: '#f1f3f5',   // Very light gray
          200: '#e9ecef',   // Light gray
          300: '#dee2e6',   // Soft gray
          400: '#ced4da',   // Medium light gray
          500: '#adb5bd',   // Medium gray
          600: '#6c757d',   // Muted gray
          700: '#495057',   // Dark muted gray
          800: '#343a40',   // Very dark gray
          850: '#262d2e',   // Darkest gray
          900: '#212529',   // Darkest gray, almost black
          950: '#1c2025',   // Ultra dark, near black
        },
        gray: {
          50: '#f8f9fa',    // Lightest, almost white
          100: '#f1f3f5',   // Very light gray
          200: '#e9ecef',   // Light gray
          300: '#dee2e6',   // Soft gray
          400: '#ced4da',   // Medium light gray
          500: '#adb5bd',   // Medium gray
          600: '#6c757d',   // Muted gray
          700: '#495057',   // Dark muted gray
          800: '#343a40',   // Very dark gray
          900: '#252a30',   // Darkest gray, almost black
          950: '#18181b',   // Ultra dark, near black
        }
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        'subtle': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'medium': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      transitionProperty: {
        'colors': 'color, background-color, border-color, text-decoration-color, fill, stroke',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
      },
    },
    fontSize: {
      xxs: '0.7rem',
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
      '7xl': '4.5rem',
    }
  },
  plugins: [
    require('tailwind-scrollbar')({ nocompatible: true }),
  ],
};
