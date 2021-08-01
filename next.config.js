const withPWA = require('next-pwa');
const runtimeCaching = require('next-pwa/cache');
const { generateSitemap } = require('./scripts/generateSitemap');

module.exports = withPWA({
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    if (isServer) {
      generateSitemap();
    }

    return config;
  },

  future: {
    webpack5: true,
  },

  pwa: {
    dest: 'public',
    runtimeCaching,
  },
});
