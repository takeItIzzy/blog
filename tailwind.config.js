const colors = require('tailwindcss/colors');

const redBase = '#d80303';
const themeColorLight = '#e66107';
const themeColorDark = '#6f42c1';
const textColorDark = '#64707d';
const titleColorDark = '#558';

module.exports = {
  content: ['pages/**/*.{tsx,mdx}', './components/**/*.tsx'],
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    extend: {
      zIndex: {
        '-10': '-10',
      },
      spacing: {
        140: '35rem',
      },
      colors: {
        'red-base': redBase,
        'theme-color-light': themeColorLight,
        green: colors.emerald,
        yellow: colors.amber,
        purple: colors.violet,
      },
      keyframes: {
        'banner-title': {
          '0%': {
            opacity: 0,
            transform: 'scale(0.95)',
          },
          '100%': {
            opacity: 1,
            transform: 'scale(1)',
          },
        },
      },
      animation: {
        'banner-title': '2s ease-out 0s 1 normal none running banner-title',
      },
      typography: (_theme) => ({
        DEFAULT: {
          css: {
            a: {
              textDecoration: 'none',
              color: redBase,
              '&:hover': {
                color: 'black',
              },
            },
            code: {
              fontWeight: 300,
              color: themeColorLight,
              background: 'inherit !important',
            },
          },
        },
        dark: {
          css: {
            a: {
              '&:hover': {
                color: textColorDark,
              },
            },
            code: {
              fontWeight: 300,
              color: themeColorDark,
              background: 'inherit !important',
            },
            'h1,h2,h3,h4,h5,h6,th': {
              color: titleColorDark,
            },
            'p,strong,pre code': {
              color: textColorDark,
            },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
