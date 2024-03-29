---
title: 'react 中的状态管理（三）——响应系统原理'
description: '响应系统的实现原理，以及 react 下响应系统的实现方式'
keywords: 'javascript,typescript,前端,react,状态管理,state management,tearing'
date: '2022-08-19T12:03:00+08:00'
tag: 'tutorial'
---

# 系列文章

- [react 中的状态管理（一）——社区状态管理方案浅析](/posts/state-management-in-react-1)
- [react 中的状态管理（二）——los 的核心 api 设计](/posts/state-management-in-react-2)
- --> [react 中的状态管理（三）——响应系统原理](/posts/state-management-in-react-3)
- [react 中的状态管理（四）——实现 los 状态注册和响应系统](/posts/state-management-in-react-4)
- [react 中的状态管理（五）——实现 los 其余主要 api](/posts/state-management-in-react-5)
- [react 中的状态管理（六）——扩展 los 的 api](/posts/state-management-in-react-6)

在 [上一篇文章](/posts/state-management-in-react-2) 中，我谈到了我理想中的状态管理库的核心 api 设计，并为这个库取名为 `los`，意为 `last one step`。这篇文章中，我会介绍 los 作为一个状态管理库的核心能力——响应系统的原理。

# 响应式数据

状态，和普通的数据的区别在于，状态的变化，会引起视图的更新。一个普通的数据，比如通过 useRef 声明，或是直接声明一个 js 变量，无论怎么为它重新赋值，它所在的组件都不会重新渲染。而状态是响应式的，更新状态，状态所在的组件会重新渲染，以显示最新的状态值。

所以，要想实现一个状态管理库，核心是要实现一套响应系统，让数据变为响应式的。

## 响应系统原理

响应系统的核心原理是这样的循环：

```
读取值时追踪该值 ⇄ 设置值时推送更新到所有可读取值的地方
```

具体的实现思路就是，在读取值的地方将一个更新订阅的方法收集到一个桶中，然后当值更新时，从桶中取出这些方法，挨个执行，从而更新视图。所有的状态管理库，不管暴露的 API 如何，不管底层使用什么方案实现，其实现响应系统的原理都是如此。

## 响应系统实现方式

在 react 中，**以往**这个更新订阅的方法通常是借助 useState，将 useState 返回的更新方法封装为一个订阅函数。这里为便于理解，我以最简单的计数器来说明。在状态管理库中使用 `useState` 声明一个 number 类型的状态，封装一个让 state 递增的方法，将该方法收集入桶中，大概这样：

```js
const useLosValue = () => {
  const [_count, setcount] = React.useState(0);
  
  const subscribe = () => setCount(prev => prev + 1);

  React.useEffect(() => {
    bucket.add(subscribe);
    
    return () => bucket.delete(subscribe);
  }, []);
  
  // 返回值的逻辑
  // ...
}
```

`useLosValue` 会在组件中调用，用于读取状态，在这个方法中将更新订阅的方法添加到桶中，这就实现了上面循环中的 `读取值时追踪该值`。在组件卸载时从桶中移除这个订阅方法，从而达到取消订阅的目的，后面这个状态再更新，就不需要再通知这个组件了。

接着在值更新时，将桶中的方法取出来依次调用：

```js
const useSetLosState = () => {
  // 更新状态逻辑
  // ...
  
  bucket.forEach((fn) => fn());
}
```

`useSetLosState` 是用于设置值的方法，在其中将值更新到 store 中后，将每个订阅方法取出来执行一次，也就是将之前存入桶中的 `subscribe` 方法执行一次。

每个 `subscribe` 方法被调用，count 会更新，而 count 是一个通过 `useState` 声明的状态，react 会负责让 count 所在的组件更新。这就达到了当设置值时让读取了值的组件重新渲染的目的。

现在你应该明白了为什么我在上一篇文章中说将读取值和设置值的方法拆分，状态管理库就能让只设置了值而没有读取值的组件不更新，因为只有读取了值的组件，其内才有这个计数器，其更新方法才会被收集到桶中。

可能你已经注意到了，我提到这是**以往**响应系统的实现方式，那是因为在 react18 之后，像状态管理库这样的外部 store 在与 react 同步状态时，会出现一个叫"撕裂"（tearing）的问题。

![react17 组件渲染方式](/posts/state-management-in-react-3-1.png)

如上图所示，在 react17 及更早之前的版本中，组件树开始渲染之后，如果此时外部 store 再有状态发生变化，react 不会让状态立马更新，所有组件读取到的都是之前的值，等此次渲染完成，再更新外部 store 的状态，然后再触发新一轮的渲染。

![react18 组件渲染方式](/posts/state-management-in-react-3-2.png)

如上图所示，在 react18 中，由于 concurrent rendering 的引入，组件树开始渲染之后也允许更新状态，这样可以让页面渲染时不至于卡死，从而带来更好的用户体验。这就带来了"撕裂"的问题，当组件树开始渲染之后，有的组件应用了外部 store 的值，此时外部 store 状态发生了变化，react 会让状态立马更新，剩余还没渲染完的组件在读取该值时，就会读取到新的值，从而导致有些组件用上一个版本的值，有些组件用新版本的值。同一个状态，在页面上呈现了不同的值，这就是"撕裂"。通常这样的撕裂是暂时的，当外部 store 的状态稳定后，组件树最终会全部应用新值，但也并不总是这样，这依赖于外部 store 的实现。而且即使是暂时的撕裂，在用户体验上也是不好的。

react 的内部状态是没有撕裂现象的，react 会处理好状态的同步问题。内部状态就是受 react 调度的状态，比如 useState、useReducer，除此以外都是外部状态，即使是 useRef，因为其值不受 react 调度，所以也是一种外部状态。撕裂只出现在外部状态中，如果一个状态管理库的 store 也是使用 useState 或 useReducer 维护的，那就也属于内部状态，否则就是一种外部状态。

为了解决这个问题，react 推出了一个名为 `useSyncExternalStore` 的 hook。从名字就能看出来，其实这个 hook 就是让外部状态继续使用 react17 及以下的同步渲染模式更新状态，这样页面就不会发生撕裂现象。

# 总结

本文介绍了 store 的数据结构和响应系统的原理，以及在 react17 及以下版本中，状态管理库实现响应系统的通用方法；然后解释了为什么这样的方法在 react18 中会有问题，以及 react 做出什么样的努力来解决这个问题。

在 [下一篇文章](/posts/state-management-in-react-4) 中，我会介绍如何注册原子类型到 store 中，即 store 与 `atom()` 方法的实现，以及如何基于 `useSyncExternalStore` 实现一个响应系统，即 `useLosValue()` 和 `useSetLosState()` 的实现。
