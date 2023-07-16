import hljs from 'highlight.js';
import javascript from 'highlight.js/lib/languages/javascript';
import 'highlight.js/styles/github-dark.css';
import React from 'react';

hljs.registerLanguage('javascript', javascript);

interface Props {
  children: string;
  activeLineIndex: number;
}

const CodeBlock = ({ children, activeLineIndex = -1 }: Props) => {
  React.useLayoutEffect(() => {
    hljs.highlightAll();
  }, []);

  return (
    <pre className="relative">
      <code className="language-js language-javascript">{children}</code>
      <div
        className={`${
          activeLineIndex >= 0 ? 'block' : 'hidden'
        } absolute top-6 transition-transform duration-300 ease-in-out border-2 rounded border-green-500 border-solid h-7 w-11/12`}
        style={{ transform: `translateY(${24 * activeLineIndex}px)` }}
      />
    </pre>
  );
};

export default CodeBlock;
