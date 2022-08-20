---
title: '让 context 管理你的数据流'
description: '使用 context 封装数据流'
keywords: 'javascript,前端,react,hooks,useContext,Provider'
date: '2022-08-20T17:33:00+08:00'
tag: 'experience'
---

# 写在前面

提到 context，很多人的想到的用法是使用 useContext + useReducer 进行状态管理。但除此之外，context 还有一个用处，那就是隐藏数据流，让组件更干净。我在 [这篇文章](/posts/react-compound-components) 中提到的复合组件也是这个模式的一种小型应用场景。

# 一个抽屉管理的例子

在 toB 的项目中，肯定会有很多使用抽屉的场景。比较常规的做法，是每遇到一个业务场景，就基于组件库——比如 antd——提供的 Drawer 组件，封装一个业务抽屉，大概像下面这样：

```jsx
const MyDrawer = ({ visible, onHide }) => {
  return (
    <Drawer visible={visible} onHide={onHide}>
      {/* 组件具体内容 */}
    </Drawer>
  )
}
```

然后在页面中维护抽屉的开关状态：

```jsx
const Page = () => {
  const [drawerVisible, setDrawerVisible] = React.useState(false);
  
  return (
    <>
      <button onClick={() => setDrawerVisible(true)}>打开抽屉</button>
      {/* 页面内容 */}
      <MyDrawer visible={drawerVisible} onHide={() => setDrawerVisible(false)} />
    </>
  )
}
```

这可能是最普通也是最常见的写法了，中规中矩，但肯定不是最好的写法。在页面中需要维护跟页面无关的状态和事件，页面中抽屉数量越多，声明的 useState 就越多，代码就显得越发冗余。你可以为父页面中抽屉有关的状态和其 setter 方法封装自定义 hook，但也只是略微降低了模板代码量，并没有质的提升。

有的人喜欢通过 ref 操作抽屉：

```jsx
const MyDrawer = (props, ref) => {
  const [visible, setVisible] = React.useState(false);
  React.useImperativeHandle(ref, () => ({
    onOpenDrawer: () => {
      setVisible(true);
    },
    onHideDrawer: () => {
      setVisible(false);
    }
  }));
  
  return (
    <Drawer visible={visible} onHide={() => setVisible(false)}>
      {/* 抽屉内容 */}
    </Drawer>
  )
};

const Page = () => {
  const drawerRef = React.useRef();
  
  return (
    <>
      <button onClick={drawerRef.current.onOpenDrawer}>打开抽屉</button>
      {/* 页面内容 */}
      <MyDrawer />
    </>
  )
}
```

且不说这是写在 [官方文档](https://reactjs.org/docs/refs-and-the-dom.html#when-to-use-refs) 中的反例，事实上这样也并没有比在父页面维护抽屉的状态更方便。看似父页面不再维护与自己无关的状态和事件，使抽屉的功能更加内聚，但父页面还是要声明 ref、调用子组件的方法，且每个抽屉组件都是要声明暴露给父页面的方法，依然很麻烦，数据流甚至更混乱了。

另外，这种一个业务场景封装一个抽屉的做法还有一个问题。当业务抽屉内部维护着自己的状态时，这个状态并不会随着抽屉的关闭而自动重置，因为抽屉的开关只是样式上的显隐，组件一直都挂载着，没有被销毁。所以就需要开发者手动处理重置状态的逻辑。

其实像抽屉这个场景，就很适合通过 context 来管理。

# 使用 Provider 管理抽屉

我为我的项目实现了一个 Provider 用于管理 dialog 组件，它的用法如下：

```jsx
const DrawerContent = () => {
  return (
    <>
      {/* 仅为抽屉的内容，而不需要调用 Drawer 组件 */}
    </>
  )
};
const Page = () => {
  return (
    <>
      {/* 页面内容 */}
      <DialogProvider.OpenButton
        acceptor={DrawerContent}
        {/* 根据类型是 drawer 还是 modal，将内容组件渲染到抽屉或弹窗中 */}
        dialogType="drawer"
        dialogProps={{
          // dialog 组件的 props，可以传入如 size、style 等属性控制 dialog 的样式
        }}
        contentProps={{
          // dialog 内容组件的 props
        }}
      >
        打开抽屉
      </DialogProvider.OpenButton>
    </>
  )
}

const App = () => {
  return (
    <DialogProvider>
      <Page />
    </DialogProvider>
  )
}
```

DialogProvider 内部维护了一个栈结构，每当有抽屉需要开启，就将其压入栈中，迭代生成抽屉组件。当抽屉关闭时将其弹出栈。开启关闭抽屉的逻辑全部由 Provider 管理，在 Provider外根本感知不到数据流。不论是父页面，还是业务抽屉，代码都没有任何的冗余，做到最精简。

DialogProvider 和 OpenButton 之间，就是使用 useContext 进行通信的，在 react 原生提供的能力中，只有 useContext 才能让两个组件相隔如此远还能如此低成本地通信。

当你觉得数据流又多又乱时，不妨试试通过 context 来管理，它可以将数据流完全隐藏在 Provider 与组件（或自定义 hook）之中，而且 context 天生需要状态提升，这至少可以保证你的数据流一定是单向的，不至于随意流动。

这种模式在面对需要对组件进行批量操作的场景时非常好用，因为它的复杂度是 O(1)，而常规的写法复杂度是 O(n)。比如你需要对各表单组件进行批量操作，像是禁用掉所有的输入框，那就可以二次封装 Input 组件，在组件中引入 useContext，获得一份从 BatchProvider 传下来的配置，以后就是一劳永逸了。想想如果是最常规的写法，那需要在一个个子组件中找到每个 Input 组件，传入一份相同的 props。

现在社区中有越来越多的库提供 Provider 供开发者使用，这种模式将库中各组件的通信完全隐藏在库内部，统一在 Provider 中进行管理，大大提高了开发者体验与代码质量，还可以在 Provider 处做全局的默认配置。
