import Layout from 'components/layout';
import { GetStaticProps } from 'next';
import { getAllPostTags, getSortedPostsData } from 'libs/posts';
import { MD, Tag } from 'types/interfaces';
import ArticleDirector from '../../components/articleDirector';
import { useCallback, useEffect, useState } from 'react';

export const tagMap: Record<Tag, string> = {
  tutorial: '📖',
  note: '✏',
  experience: '👀',
};

const tagDesc: {
  id: Tag;
  icon: string;
  desc: string;
}[] = [
  {
    id: 'tutorial',
    icon: tagMap.tutorial,
    desc: '表示这是一篇完整的教程',
  },
  {
    id: 'note',
    icon: tagMap.note,
    desc: '表示这是一篇学习笔记',
  },
  {
    id: 'experience',
    icon: tagMap.experience,
    desc: '表示这只是对某个知识点的探究，或是对我的经历的心得体会',
  },
];

const Posts = ({ allPostsData, allPostTags }: { allPostsData: MD[]; allPostTags: string[] }) => {
  const [posts, setPosts] = useState(allPostsData);

  const resetFilter = useCallback(() => {
    setPosts(allPostsData);
  }, [allPostsData]);

  const filterTag = useCallback<(tag: Tag) => void>(
    (tag) => {
      setPosts(allPostsData.filter((item) => item.tag === tag));
    },
    [allPostsData]
  );

  useEffect(() => {
    resetFilter();
  }, [resetFilter]);

  return (
    <Layout
      seo={{
        title: '赵宇轩的文章',
        description: '这里是赵宇轩写的技术文章，有赵宇轩的学习感悟以及心得分享。',
        keywords: '博客,技术,前端,js,javascript,文章',
      }}
      pageTitle={
        <>
          看看 <span className="text-red-base">赵宇轩</span>
          <br />
          写过的文章
        </>
      }
      pageSize="light"
    >
      <section className="w-full">
        <h3>嗨，这些是我写过的文章，希望能帮助到你~</h3>
        <div className="my-2">
          <p>不同的 emoji 表示不同的涵义——</p>
          <p className="text-xs text-gray-400">
            点击下面的三个 emoji 来过滤文章，
            <button className="text-red-base hover:text-gray-400" onClick={resetFilter}>
              点击这里
            </button>{' '}
            重置过滤
          </p>
        </div>
        <ul>
          {tagDesc.map((item) => (
            <li key={item.icon}>
              <button onClick={() => filterTag(item.id)}>{item.icon}</button>
              <span className="ml-1">{item.desc}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-12">
        <ul>
          {posts.map((post) => (
            <li key={post.id}>
              <ArticleDirector postInfo={post} />
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  const allPostsData = getSortedPostsData();
  const allPostTags = getAllPostTags();
  return {
    props: { allPostsData, allPostTags },
  };
};

export default Posts;
