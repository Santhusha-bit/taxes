import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'Courier New', 'monospace'],
      },
      colors: {
        cream: {
          DEFAULT: '#faf8f3',
          2: '#f2efe6',
          3: '#e8e4d9',
        },
        navy: {
          DEFAULT: '#0d1b2a',
          2: '#1a2e42',
          3: '#253d54',
        },
        gold: {
          DEFAULT: '#c9943a',
          2: '#e8b86d',
          bg: '#fdf6e8',
        },
        emerald: {
          DEFAULT: '#1a6b4a',
          bg: '#edf7f2',
        },
        ruby: {
          DEFAULT: '#9b2335',
          bg: '#fdf0f2',
        },
        sky: {
          DEFAULT: '#1d5a8e',
          bg: '#eef5fc',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(13,27,42,0.08), 0 4px 16px rgba(13,27,42,0.04)',
        card2: '0 2px 8px rgba(13,27,42,0.1), 0 12px 40px rgba(13,27,42,0.08)',
      },
    },
  },
  plugins: [],
}
export default config
