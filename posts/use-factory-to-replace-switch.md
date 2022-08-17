---
title: '使用工厂替代 switch'
description: '使用工厂替代 switch'
keywords: 'javascript,前端,switch,factory'
date: '2021-08-01T21:15:30+08:00'
tag: 'note'
---

# 使用工厂替代 switch

相信每一个 JSer 都知道 JavaScript 是如何进行分支控制的—— if else、三目运算和 switch。

JavaScript 的 switch 语句其实很难用——

1. 它的缩进让人很烦躁，如果不借助一些代码格式化工具，比如 prettier，你需要自己管理缩进。
2. 你经常需要手动 break 或者 return，这样才能避免让它进入下一个分支，你有没有过忘记写 break 的经历?
3. switch 不能直接用于为变量赋值，你要先使用 `let` 声明一个变量，然后在不同的分支中为该变量赋值。而 `let` 声明在开发中是要尽量避免的。

其实你完全可以设计一个工厂来实现和 switch 一样的效果，并且更优雅——

```jsx
const obj = {
  case1: () => {},
  case2: () => {},
};

const result = obj[yourCase]();
```

这样不用自己管理缩进，不需要使用 let，可以直接为变量赋值。

鉴于简单使用对象替代 switch，仍然需要为一个对象变量赋值，并且没有实现 switch 中的 `default` 子句，我们可以实现一个工具函数——

```jsx
const dict = (selector, option, ...params) =>
  selector[option]?.(...params) ?? selector.default?.(...params);
```

这样就可以少声明一个变量，并且在所有分支都不匹配时依然匹配 default 分支——

```jsx
const defaultResult = dict({
  default: () => 1,
}, 'case1'); // 1
```

这个函数在 react 里用处巨大，我在实现该函数之前没觉得缺少什么，但是实现它以后，我的代码里已经到处是它的身影了，因为它可以与 hooks 结合，优雅地替换 JSX——

```jsx
const tabs = ['tab1', 'tab2', 'tab3'];

const MyComponent = () => {
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <>
      <Navbar tabs={tabs} activeTab={activeTab} onSelect={setActiveTab} />
      {dict(
        {
          tab1: () => <Tab1Content />,
          tab2: () => <Tab2Content />,
          tab3: () => <Tab3Content />,
        },
        activeTab
      )}
    </>
  );
};
```

上面的代码使用 dict 在切换不同的 tab 页时渲染不同的组件。JSX 中是不能写 if else 和 switch 的，想实现相同的效果，要么将这部分代码抽离出来，写一个 render 函数或是多封装一层组件，要么就只能通过三目运算符和逻辑与运算符。但是 render 函数太难看，多封装一层组件在简单场景下显得累赘，运算符在可读性上显然不够强，且其功能局限性太大，只能直接返回一个值，不能计算求值。而只要是根据某个特定条件渲染不同组件的需求，都可以使用 dict 来优雅地实现。

不仅是 react 渲染时的状态控制，写原生 js 也要经常用到 dict，只要是根据某个特定条件求值的需求，都可以使用 dict 来减少代码量，使代码可读性更强。

在有的时候，dict 还可以替代一部分 if else 的工作。在开发工作中，我们经常能遇到只有两种状态的情况，而这种情况我们很容易想到使用布尔值来标记状态。

比如有一个表单页面，这个页面存在**新建**和**编辑**两种状态，表单元素完全一致，只是编辑页在打开的时候会填充默认值。这种情况下，一般是使用一个布尔值 `isCreate`，如果为 `true` 就是新建，`false` 就是编辑。但这样总是让人感觉怪怪的，这种写法默认把**非新建**的状态都归为了**编辑**。那如果以后加入了第三种状态，代码的改动就很大了，而如果将 `isCreate` 拆为 `CREATE` 和 `EDIT` 两个状态，将每个 `if (isCreate) {...} else {...}` 都替换为 dict，那就可以对新增的状态无所畏惧。像这种用布尔值标记两种状态的地方，也都可以尝试用 dict 来替换。

不要再继续使用 switch 了，这个语句没有任何存在的必要，很多语言甚至没有提供 switch，比如 python，rust，一众 ML 系语言。ML 系使用模式匹配（pattern matching）来管理分支，其实本文所讲的工厂模式也是一种最最简单的模式匹配。至于网上很多文章说使用 switch 来替代 if else，使代码可读性更高，其实这两种语法没有太大的区别，使用 switch 并不会比一排 if 写出来的代码更漂亮。

自从我实现了 dict，我再也没有写过 switch，并且我完全不怀念它。
