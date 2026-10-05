/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        faetec: { 900: '#003087', 800: '#004aad' }
      }
    }
  },
  plugins: []
};
