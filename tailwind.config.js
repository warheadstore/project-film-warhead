/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink:    '#080A0C',
        inkl:   '#0F1215',
        inke:   '#161B20',
        inkb:   '#1E252D',
        gold:   '#E50914',
        goldd:  '#B20710',
        goldf:  'rgba(229,9,20,0.12)',
        silver: '#A0AAB4',
        dim:    '#505A65',
        ghost:  'rgba(255,255,255,0.05)',
        ghosth: 'rgba(255,255,255,0.09)',
        line:   'rgba(255,255,255,0.07)',
      },
      fontFamily: {
        display: ['Archivo', 'system-ui', 'sans-serif'],
        body:    ['Figtree', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.35s ease-out both',
        'shimmer': 'shimmer 1.8s linear infinite',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-600px 0' },
          '100%': { backgroundPosition: '600px 0' },
        },
      },
    },
  },
  plugins: [],
};
