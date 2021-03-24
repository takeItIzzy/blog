import MyLink from './myLink';
import Time from './time';
import { MD } from 'types/interfaces';
import { tagMap } from 'pages/posts';

const ArticleDirector = ({ postInfo }: { postInfo: MD }) => (
  <div className="flex my-2 border-b-2 border-black dark:border-green-50">
    <div className="w-5/6">
      <MyLink
        href={`/posts/${postInfo.id}`}
        customColor
        className="text-xl hover:no-underline text-black hover:text-red-base dark:text-green-50 dark:hover:text-red-base"
      >
        <span>{tagMap[postInfo.tag]}</span>
        {postInfo.title}
      </MyLink>
    </div>
    <Time date={postInfo.date} className="w-1/6" />
  </div>
);

export default ArticleDirector;
