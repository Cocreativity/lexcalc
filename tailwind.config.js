export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        navy: { DEFAULT: '#1e3a5f', 2: '#16304e', 3: '#0f2238' },
        'lex-blue': { DEFAULT: '#2b6cb0', soft: '#e8f0f9' },
      },
    },
  },
  plugins: [],
}
