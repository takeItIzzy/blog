const { generateSitemap } = require('./scripts/generateSitemap');

module.exports = {
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
};
