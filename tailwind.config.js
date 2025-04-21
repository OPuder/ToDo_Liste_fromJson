import { defineConfig } from 'tailwindcss';

export default defineConfig({
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './electron/**/*.{ts,js}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
});