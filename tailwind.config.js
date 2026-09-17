export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'Arial', 'Helvetica', 'sans-serif'],
      },
      colors: {
        yt: {
          bg: 'var(--yt-bg)',
          elevated: 'var(--yt-elevated)',
          text: 'var(--yt-text)',
          sub: 'var(--yt-sub)',
          chip: 'var(--yt-chip)',
          chipHover: 'var(--yt-chip-hover)',
          border: 'var(--yt-border)',
          hover: 'var(--yt-hover)',
          searchBorder: 'var(--yt-search-border)',
          searchBg: 'var(--yt-search-bg)',
          searchBtn: 'var(--yt-search-btn)',
          searchBtnHover: 'var(--yt-search-btn-hover)',
          skeleton: 'var(--yt-skeleton)',
          inverse: 'var(--yt-inverse)',
          inverseText: 'var(--yt-inverse-text)',
          blue: 'var(--yt-blue)',
          brand: '#ff0000',
        },
      },
      screens: {
        xs: '500px',
        '3xl': '1700px',
        '4xl': '2100px',
      },
    },
  },
}
