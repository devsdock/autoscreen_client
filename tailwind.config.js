/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        sidebar: '#1e293b',
        'sidebar-hover': '#334155',
        'sidebar-active': '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      transitionDuration: {
        '200': '200ms',
      }
    },
  },
  plugins: [],
}

