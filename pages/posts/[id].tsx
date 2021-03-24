import { getAllPostIds, getPostData } from 'libs/posts';
import { GetStaticPaths, GetStaticProps } from 'next';
import { MD } from 'types/interfaces';
import Layout from 'components/layout';
import Article from 'components/article';

const Post = ({ postData }: { postData: MD }) => {
  return (
    <Layout
      seo={{
        title: postData.title,
        description: postData.description,
        keywords: postData.keywords,
      }}
      pageTitle={postData.title}
    >
      <Article postData={postData} />
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getAllPostIds();
  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const postData = await getPostData(params?.id as string);

  if (!postData) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      postData,
    },
  };
};

export default Post;
