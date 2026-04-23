/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        success: 'var(--color-success)',
        info: 'var(--color-info)',
        danger: 'var(--color-danger)',
      },
      backgroundColor: {
        main: 'var(--color-bg-main)',
        secondary: 'var(--color-bg-secondary)',
        card: 'var(--color-bg-card)',
      },
      fontFamily: {
        heading: ['League Spartan', 'sans-serif'],
        body: ['Jost', 'sans-serif'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
    },
  },
  plugins: [],
}
