/** @type {import('tailwindcss').Config} */
// Tailwind v4: design tokens live in src/index.css @theme. This file only
// scopes content globs for the JIT scanner.
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
};
