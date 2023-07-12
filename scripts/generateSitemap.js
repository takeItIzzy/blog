const fs = require('fs');
const globby = require('globby');

const generateSitemap = async () => {
  const pages = await globby([
    'pages/**/*.{ts,tsx,mdx}',
    '!pages/_*.{ts,tsx}', // 忽略 next _app _document
    '!pages/api', // 忽略 api 路由
  ]);

  const posts = await globby('posts/*.md');

  const urlSet = pages
    .reduce((prev, curr) => {
      // 静态路由
      if (!curr.includes('[')) {
        const path = curr
        .replace('pages', '')
        .replace(/(\.tsx|\.ts|\.mdx)/, '')
        .replace('/index', '');
      return prev.concat([`<url><loc>https://takeitizzy.com${path}</loc></url>`]);
      }

      // 动态路由，去 /posts 文件夹下读取所有 md 文件名进行填充
      const dynamicRoutes = posts.map((dynamicPage) => {
        const id = dynamicPage
          .replace('/posts', '')
          .replace('.md', '');
        const dynamicPath = curr
          .replace('pages', '')
          .replace('[id]', `${id}`)
          .replace(/(\.tsx|\.ts|\.mdx)/, '')
        return `<url><loc>https://takeitizzy.com${dynamicPath}</loc></url>`;
      });

      return prev.concat(dynamicRoutes);
    }, [])
    .join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlSet}</urlset>`;

  fs.writeFileSync('public/sitemap.xml', sitemap);
};

module.exports = { generateSitemap };
