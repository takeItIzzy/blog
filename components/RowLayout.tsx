import React from 'react';
import isEmpty from 'lodash.isempty';

interface RowLayoutProps {
  children?: React.ReactNode;
  className?: string;
  /**
   * 子元素间距，只遍历一层，默认 8
   */
  space?: number;
  /**
   * 布局模板字符串，如 '--4--|--' 意为：
   * 一共有六个子元素，用 - 表示，其中第 2 和第三个子元素间隔 4 个 space 单位，
   * 其余为默认间距，前四个子元素居左，后两个子元素居右
   */
  layout?: string;
  block?: boolean;
}
interface SpacerProps {
  className?: string;
  space?: number;
  children?: React.ReactNode;
}
const Spacer = (props: SpacerProps) => {
  const { className, space = 8, children } = props;
  return (
    <div className={`${className} inline-block`} style={{ width: `${space}px` }}>
      {children}
    </div>
  );
};
Spacer.displayName = 'Spacer';
const Wrapper: React.FC<{ block?: boolean; className?: string; children: React.ReactNode }> = ({
  block,
  className,
  children,
}) => (
  <div className={`${block ? 'flex' : 'inline-flex'} ${className} justify-between items-center`}>
    {children}
  </div>
);

const LayoutUnit: React.FC<{ justifyContent: 'flex-start' | 'flex-end' }> = ({
  justifyContent,
  children,
}) => <div className={`flex items-center flex-1 ${justifyContent}`}>{children}</div>;

const RowLayout = (props: RowLayoutProps) => {
  const { children, className, space = 8, layout, block = false } = props;
  const childrenList = React.Children.toArray(children);
  // 为 childrenList 每个元素之间拼接间距
  const resolveSpace = React.useCallback(
    () =>
      childrenList.reduce((prev: any, curr: any, index) => {
        if (
          index === 0 ||
          curr.type?.displayName === 'Spacer' ||
          prev[prev.length - 1].type?.displayName === 'Spacer'
        ) {
          // 第一个 child，以及前一个元素是间距的，不拼接间距
          // 当前元素是间距的，直接追加当前元素
          return [...prev, curr];
        }
        return [
          ...prev,
          <Spacer
            space={space}
            key={`${(prev[prev.length - 1] as React.ReactElement)?.key || index}-spacer`}
          />,
          curr,
        ];
      }, []),
    [childrenList, space]
  );
  // 根据布局字符串处理排版
  const resolveLayout = React.useCallback((): {
    left?: React.ReactNode[];
    right?: React.ReactNode[];
  } => {
    const left: React.ReactNode[] = [];
    const right: React.ReactNode[] = [];
    // 把 '--12-' 拆分成 ['-', '-', '12', '-']
    const layoutArr = (layout as string).split('').reduce((prev: string[], curr) => {
      const reg = /^(0|([1-9]\d*))$/;
      if (reg.test(prev[prev.length - 1]) && reg.test(curr)) {
        // 上一个元素和当前元素都是数字
        const last = prev.pop();
        return [...prev, last + curr];
      }
      return [...prev, curr];
    }, []);
    let offset = 0; // 使用一个偏移量修复匹配到数字时，layoutArr 与 childrenList 中元素 index 的偏移
    let currentUnit = left;
    for (let index = 0; index < layoutArr.length; index += 1) {
      const item = layoutArr[index];
      const i = index + offset;
      if (item === '|') {
        offset -= 1;
        currentUnit = right;
        continue;
      }
      if (item === '-') {
        // 当前元素是占位符
        // 每个元素前拼接 spacer，第一个元素后，以及前一个元素是显示指定的间距则不拼接
        if (index === 0 || layoutArr[index - 1] !== '-') {
          currentUnit.push(childrenList[i]);
        } else {
          currentUnit.push(
            <Spacer
              space={space}
              key={`${(childrenList[i] as React.ReactElement)?.key || index}-spacer`}
            />,
            childrenList[i]
          );
        }
      } else {
        // 当前元素是显示指定的间距
        offset -= 1;
        currentUnit.push(
          <Spacer
            space={+item}
            key={`${(childrenList[i] as React.ReactElement)?.key || index}-spacer`}
          />
        );
      }
    }
    return {
      ...(!isEmpty(left) && { left }),
      ...(!isEmpty(right) && { right }),
    };
  }, [childrenList, layout, space]);
  if (layout === undefined) {
    return <Wrapper>{resolveSpace()}</Wrapper>;
  }
  const resolvedLayout = resolveLayout();
  return (
    <Wrapper block={block} className={className}>
      <LayoutUnit justifyContent="flex-start">{resolvedLayout.left}</LayoutUnit>
      {resolvedLayout.right && (
        <LayoutUnit justifyContent="flex-end">{resolvedLayout.right}</LayoutUnit>
      )}
    </Wrapper>
  );
};
RowLayout.Spacer = Spacer;

export default RowLayout;
