import hljs from 'highlight.js';
import javascript from 'highlight.js/lib/languages/javascript';
import 'highlight.js/styles/github-dark.css';
import React from 'react';
import classnames from 'classnames';

hljs.registerLanguage('javascript', javascript);

interface Props {
  children: string;
  activeLineIndex: number;
}

const CodeBlock = ({ children, activeLineIndex = -1 }: Props) => {
  const lineHeight = React.useRef(28);
  const isMobile = React.useRef(false);

  React.useLayoutEffect(() => {
    hljs.highlightAll();
  }, []);

  React.useLayoutEffect(() => {
    isMobile.current = window.innerWidth < 1024;
    lineHeight.current = isMobile.current ? 24 : 28;
  });

  return (
    <pre className="relative">
      <code className="language-js language-javascript">{children}</code>
      <div
        className={classnames(
          'absolute transition-transform duration-300 ease-in-out border-2 rounded border-green-500 border-solid h-7 w-11/12',
          {
            block: activeLineIndex >= 0,
            hidden: activeLineIndex < 0,
            'top-6': isMobile.current,
            'top-8': !isMobile.current,
          }
        )}
        style={{ transform: `translateY(${lineHeight.current * activeLineIndex}px)` }}
      />
    </pre>
  );
};

export default CodeBlock;
