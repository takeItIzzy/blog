const fs = require('fs');
const globby = require('globby');

const generateSitemap = async () => {
  const pages = await globby([
    'pages/**/*.{ts,tsx}',
    // '!pages/**/[*.{ts,tsx}', // 忽略动态路由
    '!pages/_*.{ts,tsx}', // 忽略 next _app _document
    '!pages/api', // 忽略 api 路由
  ]);

  const urlSet = pages
    .map((page) => {
      const path = page
        .replace('pages', '')
        .replace(/(\.tsx|\.ts)/, '')
        .replace('/index', '');
      return `<url><loc>https://takeitizzy.com${path}</loc></url>`;
    })
    .join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlSet}</urlset>`;

  fs.writeFileSync('public/sitemap.xml', sitemap);
};

module.exports = { generateSitemap };
