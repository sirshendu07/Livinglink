/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          main: '#0B0D10',
          secondary: '#11151A',
          sidebar: '#0E1115',
          card: '#151A20',
          elevated: '#1B222A'
        },
        text: {
          primary: '#F1F3F5',
          secondary: '#89939E'
        },
        border: {
          muted: '#252D36'
        },
        accent: {
          DEFAULT: '#B8E0C1',
          hover: '#9FD4AA',
          muted: 'rgba(184, 224, 193, 0.12)'
        },
        status: {
          success: '#48C78E',
          warning: '#E9B766',
          danger: '#F07178',
          info: '#78A9DD'
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ],
        display: [
          'Cabinet Grotesk',
          'Inter',
          '-apple-system',
          'sans-serif'
        ]
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        card: '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        glow: '0 0 20px -5px rgba(184, 224, 193, 0.25)',
        alert: '0 0 25px -5px rgba(240, 113, 120, 0.3)'
      }
    }
  },
  plugins: []
};
