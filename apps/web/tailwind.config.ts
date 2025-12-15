import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        /* ===================================
           APPLYFORUS FUTURISTIC COLOR SYSTEM
           Deep Black + Neon Yellow + Electric Green
           =================================== */

        // Primary: Neon Yellow - High energy, optimism, innovation
        neonYellow: {
          50: '#FFFEF5',
          100: '#FFFDE8',
          200: '#FFF9C4',
          300: '#FFF59D',
          400: '#FFEE58',
          500: '#FACC15', // Primary neon yellow #FACC15
          600: '#EAB308',
          700: '#CA8A04',
          800: '#A16207',
          900: '#854D0E',
          950: '#713F12',
          DEFAULT: '#FACC15',
        },

        // Secondary: Electric Green - Growth, success, futuristic
        electricGreen: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E', // Primary electric green #22C55E
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
          950: '#052E16',
          DEFAULT: '#22C55E',
        },

        // Deep Black - Base, sophistication, depth
        deepBlack: {
          50: '#F5F5F5',
          100: '#E5E5E5',
          200: '#CCCCCC',
          300: '#999999',
          400: '#666666',
          500: '#333333',
          600: '#1F1F1F',
          700: '#171717',
          800: '#0F0F0F', // Main deep black
          900: '#0A0A0A',
          950: '#050505', // Near pure black
          DEFAULT: '#0A0A0A',
        },

        // Soft Black - Cards, elevated surfaces
        softBlack: {
          50: '#F8F8F8',
          100: '#E8E8E8',
          200: '#D0D0D0',
          300: '#A8A8A8',
          400: '#787878',
          500: '#484848',
          600: '#282828',
          700: '#1C1C1C', // Main soft black
          800: '#141414',
          900: '#0D0D0D',
          950: '#080808',
          DEFAULT: '#1C1C1C',
        },

        // Legacy - Keep for backwards compatibility
        charcoal: {
          50: '#F7F7F8',
          100: '#EBEBED',
          200: '#D1D1D6',
          300: '#B7B7BF',
          400: '#9D9DA8',
          500: '#6B6B7A',
          600: '#525261',
          700: '#3D3D49',
          800: '#2A2A33',
          900: '#1A1A1F',
          950: '#0F0F13',
        },
        slate: {
          50: '#F8F9FA',
          100: '#F1F3F5',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#CED4DA',
          500: '#ADB5BD',
          600: '#6C757D', // #6C757D - Main slate
          700: '#495057',
          800: '#343A40',
          900: '#212529',
          950: '#1A1D20',
        },
        warmGray: {
          50: '#FAFAF9',
          100: '#F5F5F4',
          200: '#E7E5E4',
          300: '#D6D3D1',
          400: '#A8A29E',
          500: '#78716C', // #78716C - Main warm gray
          600: '#57534E',
          700: '#44403C',
          800: '#292524',
          900: '#1C1917',
          950: '#0C0A09',
        },
        teal: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6', // #14B8A6 - Main teal
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
          950: '#042F2E',
        },
        mutedBlue: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#829AB1',
          500: '#627D98', // #627D98 - Main muted blue
          600: '#486581',
          700: '#334E68',
          800: '#243B53',
          900: '#102A43',
          950: '#0A1F33',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
          950: '#042F2E',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: {
          DEFAULT: '#10B981',
          foreground: '#FFFFFF',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        warning: {
          DEFAULT: '#F59E0B',
          foreground: '#FFFFFF',
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        error: {
          DEFAULT: '#EF4444',
          foreground: '#FFFFFF',
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        info: {
          DEFAULT: '#3B82F6',
          foreground: '#FFFFFF',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Courier New', 'monospace'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '40px' }],
        '5xl': ['48px', { lineHeight: '48px' }],
        '6xl': ['60px', { lineHeight: '60px' }],
        '7xl': ['72px', { lineHeight: '72px' }],
      },
      spacing: {
        '0.5': '2px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
        '32': '128px',
        '40': '160px',
        '48': '192px',
        '56': '224px',
        '64': '256px',
      },
      borderRadius: {
        lg: 'var(--radius, 8px)',
        md: 'calc(var(--radius, 8px) - 2px)',
        sm: 'calc(var(--radius, 8px) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'spin': {
          to: { transform: 'rotate(360deg)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        'slide-in-from-top': {
          from: { transform: 'translateY(-100%)' },
          to: { transform: 'translateY(0)' },
        },
        'slide-in-from-bottom': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'slide-in-from-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-in-from-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        'pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'bounce': {
          '0%, 100%': {
            transform: 'translateY(-25%)',
            animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
          },
          '50%': {
            transform: 'translateY(0)',
            animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
          },
        },
        'ping': {
          '75%, 100%': {
            transform: 'scale(2)',
            opacity: '0',
          },
        },
        // Futuristic Animations
        'glow-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(250, 204, 21, 0.5)',
          },
          '50%': {
            boxShadow: '0 0 40px rgba(250, 204, 21, 0.8)',
          },
        },
        'glow-pulse-green': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)',
          },
          '50%': {
            boxShadow: '0 0 40px rgba(34, 197, 94, 0.8)',
          },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'border-flow': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'spin': 'spin 1s linear infinite',
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-out': 'fade-out 0.2s ease-in',
        'slide-in-from-top': 'slide-in-from-top 0.3s ease-out',
        'slide-in-from-bottom': 'slide-in-from-bottom 0.3s ease-out',
        'slide-in-from-right': 'slide-in-from-right 0.3s ease-out',
        'slide-in-from-left': 'slide-in-from-left 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce': 'bounce 1s infinite',
        'ping': 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
        // Futuristic Animations
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'glow-pulse-green': 'glow-pulse-green 2s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 3s ease infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'scan-line': 'scan-line 2s linear infinite',
        'border-flow': 'border-flow 3s ease infinite',
      },
      backgroundImage: {
        // Futuristic Gradients
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-futuristic': 'linear-gradient(135deg, #0A0A0A 0%, #1C1C1C 50%, #0A0A0A 100%)',
        'gradient-yellow-green': 'linear-gradient(135deg, #FACC15 0%, #22C55E 100%)',
        'gradient-green-black': 'linear-gradient(135deg, #22C55E 0%, #0A0A0A 100%)',
        'gradient-yellow-black': 'linear-gradient(135deg, #FACC15 0%, #0A0A0A 100%)',
        'gradient-hero': 'linear-gradient(135deg, #0A0A0A 0%, #141414 25%, #0A0A0A 50%, #1C1C1C 75%, #0A0A0A 100%)',
        'gradient-glow-yellow': 'radial-gradient(circle at center, rgba(250, 204, 21, 0.15) 0%, transparent 70%)',
        'gradient-glow-green': 'radial-gradient(circle at center, rgba(34, 197, 94, 0.15) 0%, transparent 70%)',
        'grid-pattern': 'linear-gradient(rgba(250, 204, 21, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(250, 204, 21, 0.03) 1px, transparent 1px)',
      },
      boxShadow: {
        'glow-yellow': '0 0 20px rgba(250, 204, 21, 0.5)',
        'glow-yellow-lg': '0 0 40px rgba(250, 204, 21, 0.6)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.5)',
        'glow-green-lg': '0 0 40px rgba(34, 197, 94, 0.6)',
        'glow-white': '0 0 20px rgba(255, 255, 255, 0.1)',
        'inner-glow': 'inset 0 0 20px rgba(250, 204, 21, 0.1)',
      },
      transitionDuration: {
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      },
    },
  },
  plugins: [],
};

export default config;
