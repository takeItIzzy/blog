import Layout from '../../components/layout';
import MyLink from '../../components/myLink';
import { articles } from '../../libs/algorithm';

const Algorithm = () => {
  return (
    <Layout
      seo={{
        title: '算法可视化',
        description: '使用可视化效果展示常见算法的运行原理',
        keywords: '博客,技术,前端,js,javascript,文章,算法,可视化',
      }}
      pageTitle={<>算法可视化</>}
      pageSize="light"
    >
      {articles.map((category) => (
        <div key={category.category}>
          <p>{category.title}</p>
          <ul>
            {category.articles.map((item) => (
              <li key={item.id}>
                <MyLink href={`/algorithm/${category.category}/${item.id}`} type="route">
                  {item.title}
                </MyLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="w-full max-w-2xl prose sm:prose lg:prose-lg dark:prose-dark"></div>
    </Layout>
  );
};

export default Algorithm;
