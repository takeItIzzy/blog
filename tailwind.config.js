const redBase = '#d80303';
const themeColorLight = '#e66107';
const themeColorDark = '#6f42c1';
const textColorDark = '#64707d';
const titleColorDark = '#558';

module.exports = {
  purge: ['./pages/**/*.tsx', './components/**/*.tsx'],
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    extend: {
      spacing: {
        140: '35rem',
      },
      colors: {
        'red-base': redBase,
        'theme-color-light': themeColorLight,
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
  variants: {
    extend: {
      typography: ['dark'],
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
