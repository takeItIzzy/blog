const OFF = 0;
const WARNING = 1;
const ERROR = 2;

module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/explicit-function-return-type': OFF,
    '@typescript-eslint/no-non-null-assertion': OFF,
    '@typescript-eslint/explicit-module-boundary-types': OFF,
    '@typescript-eslint/indent': OFF,
    'react/no-unknown-property': OFF,
    'react/react-in-jsx-scope': OFF,
  },
};
