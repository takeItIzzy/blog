import { GetStaticProps } from 'next';
import { getSortedPostsData } from 'libs/posts';
import { MD } from 'types/interfaces';
import Layout from 'components/layout';
import MyLink from 'components/myLink';

const Home = ({ allPostsData }: { allPostsData: MD[] }) => {
  return (
    <Layout
      seo={{
        title: '赵宇轩的博客',
        description: '欢迎来到赵宇轩的个人博客',
        keywords: '博客,编程,前端,js,javascript',
      }}
      pageTitle={
        <>
          欢迎来到
          <br />
          <span className="text-red-base">赵宇轩</span> 的博客
        </>
      }
      pageSize="light"
    >
      <section className="w-full flex-center flex-col">
        <p>嗨，欢迎来到我的博客~</p>
        <p>首页这里现在还没什么东西</p>
        <p>因为我还没想好要放些什么……</p>
        <p>不过以后会慢慢多起来的</p>
        <p>现在我要多写些废话来撑高度👏</p>
        <p>让它看起来不至于那么空</p>
        <p>用 iPad 的同学就先忍一忍吧😄</p>
        <p>
          也许你可以去👉 <MyLink href="/posts">我的文章</MyLink> 页看看👀
        </p>
        <p>可能会有所收获</p>
        <p>如果发现文章中有什么错误，或者想和我交流的东西</p>
        <p>
          欢迎你去{' '}
          <MyLink href="https://github.com/takeItIzzy/blog" type="link">
            github
          </MyLink>{' '}
          跟我交流
        </p>
      </section>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const allPostsData = getSortedPostsData();
  return {
    props: { allPostsData },
  };
};

export default Home;
