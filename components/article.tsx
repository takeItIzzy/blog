import { useEffect } from 'react';
import hljs from 'highlight.js';
import javascript from 'highlight.js/lib/languages/javascript';
import 'highlight.js/styles/a11y-dark.css';
import { MD } from 'types/interfaces';
import MyLink from 'components/myLink';

hljs.registerLanguage('javascript', javascript);

const Article = ({ postData }: { postData: MD }) => {
  useEffect(() => {
    hljs.highlightAll();
  }, []);

  return (
    <article className="wrapper flex-col">
      <div
        className="w-full max-w-2xl prose sm:prose lg:prose-lg dark:prose-dark"
        dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
      />
      <footer className="w-full max-w-2xl p-4 border-t border-b mt-20">
        <p className="text-center">
          原创作品自问世起即受到版权保护，欢迎前往{' '}
          <MyLink href="https://github.com/takeItIzzy/blog" type="link">
            github
          </MyLink>{' '}
          交流，请勿抄袭❤
        </p>
        <br />
        <h3>相关链接：</h3>
        <ul className="ml-6">
          {postData.referer.map((item) => (
            <li key={item.href}>
              <MyLink href={item.href} type="link">
                {item.name}
              </MyLink>
            </li>
          ))}
        </ul>
      </footer>
    </article>
  );
};

export default Article;
