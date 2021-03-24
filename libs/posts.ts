import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import remark from 'remark';
import gfm from 'remark-gfm';
import html from 'remark-html';
import uniq from 'lodash.uniq';
import { MD } from 'types/interfaces';

const postsDirectory = path.join(process.cwd(), 'posts');

const getAllPostsData = () => {
  const fileNames = fs.readdirSync(postsDirectory);
  return fileNames.map((fileName) => {
    const id = fileName.replace(/\.md$/, '');

    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    const matterResult = matter(fileContents);

    return {
      id,
      ...matterResult.data,
    } as MD;
  });
};

const getSortedPostsData = () => {
  const allPostsData = getAllPostsData();
  // Sort posts by date
  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
};

const getAllPostTags = () => uniq(getAllPostsData().map((postItem) => postItem.tag));

const getAllPostIds = () => {
  const fileNames = fs.readdirSync(postsDirectory);

  return fileNames.map((fileName) => {
    return {
      params: {
        id: fileName.replace(/\.md$/, ''),
      },
    };
  });
};

const getPostData = async (id: string | undefined) => {
  if (!id) {
    return;
  }

  const fullPath = path.join(postsDirectory, `${id}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  const matterResult = matter(fileContents);

  const processedContent = await remark().use(gfm).use(html).process(matterResult.content);
  const contentHtml = processedContent.toString();

  return {
    id,
    contentHtml,
    ...matterResult.data,
  };
};

export { getSortedPostsData, getPostData, getAllPostTags, getAllPostIds };
