/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: '#fff8f6',
        'surface-container-lowest': '#ffffff',
        'on-surface': '#281713',
        outline: '#916f66',
        primary: '#ae2a00',
        'on-primary': '#ffffff',
        secondary: '#a63a1c',
        'on-secondary': '#ffffff',
        tertiary: '#005cad', // Electric Blue focus state
        error: '#ba1a1a',
      },
      fontFamily: {
        display: ['var(--font-eb-garamond)', 'serif'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem', // 4px Level 1 Soft
        md: '0.375rem',
        lg: '0.5rem', // 8px for large cards
      }
    },
  },
  plugins: [],
}