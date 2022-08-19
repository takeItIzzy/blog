---
title: 'react 中的状态管理（二）—— los 的核心 api 设计'
description: '我理想中的状态管理库的核心 api 设计'
keywords: 'javascript,typescript,前端,react,状态管理,state management'
date: '2022-08-18T20:05:30+08:00'
tag: 'tutorial'
---

# 系列文章

- [react 中的状态管理（一）——社区状态管理方案浅析](/posts/state-management-in-react-1)
- [react 中的状态管理（二）—— los 的核心 api 设计](/posts/state-management-in-react-2)

在 [上一篇文章](/posts/state-management-in-react-1) 中，我谈到了我理想中的状态管理库的定位——辅助 react-query、替代 useContext。这篇文章我会介绍它的 api。

在想动手造一个轮子之前，要先想好该怎么用这个轮子，把目的思考清楚，再想怎么实现才能做到有的放矢。

我很喜欢 recoil、jotai 这样的原子状态的表达方式，所以首先，我的状态管理库是原子化的。另外，需要使用状态管理库的项目，想必也已经达到了一定的规模，ts 几乎是必备的了，所以，这个状态管理库一定要有良好的类型支持。

# atom

一个原子状态管理库，最核心的概念当然是原子，所以先来决定原子的表现形式。首先声明一个原子状态，各家的方案都差不多，使用 `atom()` 方法来声明。

atom() 接受一个对象，用来传入这个原子状态的各项配置。首先是默认值，默认值的好处一是可以为业务逻辑提供（或是让 UI 渲染）一个回退的值，二是传入默认值，可以让 ts 自动推导出这个原子状态的类型。

```ts
atom({
  defaultValue: 1,
});
```

在类型支持上，除了隐式类型推导，也可以传入泛型显式声明类型：

```ts
atom<number>();
```

其次，这个状态管理库的目的之一是替代 useContext，但在 Provider 被卸载后，useContext 的值会被重置，这与一般状态管理库的能力是不同的——存储在它们 store 中的值，会被一直缓存，直到页面刷新才被重置。

所以，这个状态管理库要想替代 useContext，就需要提供可以不被缓存的 atom。

我让 atom 接受 `cached` 参数，这是一个布尔值，默认为 `true`，此时这个原子状态会被 store 一直缓存，直到页面刷新；如果将其设置为 `false`，在页面上没有任何引用该原子状态的组件后（更专业的说法是没有任何的订阅者），该原子状态就会被重置。这样，这个原子状态的表现就跟使用 context 一样了。

```ts
atom({
  defaultValue: 1,
  cached: false,
})
```

这在某些场景特别有用，比如将表单的值存入 atom，但是每次打开表单页时希望呈现一份空表单，而不要保留上次填写的内容。

# 使用 atom

现今社区中对于更新状态大体分为两类方案，一类是 immutable，像 redux、recoil 这样使用类似 setState 这样的更新方法来更新数据的；另一类是 mutable，像 mobx 这样，可以直接对状态重新赋值的。

immutable 方案，对于状态管理库本身，实现成本要低很多，只要封装一个更新方法即可，而且这样与 react 自己更新状态的风格是一致的。但这要求使用者有一定的 react 基础，不要犯直接修改状态这样的错误。

mutable 方案，在底层通常是使用 Proxy 实现的，这对于状态管理库来说，工作量比起 immutable 方案要高不少，因为要对各种数据类型和可能的使用场景进行兼容，不同情况下的状态修改，使用的 Proxy 属性也是不同的。而且这种风格也不符合 react 的习惯，在使用过程中会有割裂感。但是其优点是 api 简洁，没有模板代码，而且更符合 js 赋值的直觉。

权衡利弊，我选择了 immutable 方案，所以我为其设计了类似 React.useState() 的 hook：

```ts
const [state, setState] = useStoreState(atomState);
```

这个 hook 接受一个由 `atom()` 方法返回的原子状态，并返回一个二位数组，第一位是状态值，第二位是状态的更新方法。

如果开发者只需要在一个组件里读取值或者写入值，也分别提供了对应的 hooks：

```ts
const state = useStoreValue(atomState);
```

```ts
const setState = useSetStoreState(atomState);
```

这两个 hooks 分别只返回状态值和状态的更新方法。将二者拆开有一个好处——当这个原子状态更新时，是不需要更新只设置了值，而不读取值的组件的，因为它并没有用到这个原子状态的最新值，也就不用关心值的变化。将二者拆分后，对于只引用了 `useSetStoreState` 的组件，状态管理库就知道，"它没有读取值，我并不需要去更新它"。

同样，这三个 hooks 可以根据接受的原子状态类型推导出返回值的类型。

# reducer

如果问我 redux 留下的最宝贵的思想，那我会说，reducer。

简单的 setState，其更新状态的逻辑势必要写在组件内，而 reducer 将 UI 与逻辑解耦，组件只需要调用正确的方法，就会返回正确的值，不用关心具体的实现如何。这对于组件阅读与维护，以及编写单元测试都有不小的好处。

所以我也希望可以让状态管理库支持以 dispatch 的方式更新状态。我让 atom 可以接受 `reducer` 方法，同时提供返回 dispatch 方法的 hook：

```ts
const atomState = atom({
  defaultValue: 1,
  reducer: (state, action) => {
    switch (action.type) {
      case 'increase':
        return state + 1;
      case 'decrease':
        return state - 1;
    }
  }
});

const [state, dispatch] = useStoreReducer(atomState);
```

同样的，`useStoreReducer` 也应该可以拆分为 `useStoreValue` 和 `useStoreDispatch`，分别用于仅读取值和仅修改值的场景。

在类型支持方面，我们让 atom 接受第二个泛型，用来表示 action 的类型：

```ts
const reducer = (state, action) => {/* ... */};
type Actions = { type: 'increase' } | { type: 'decrease' };
atom<number, Actions>({
  defaultValue: 1,
  reducer,
})
```

`useStoreReducer` 和 `useStoreDispatch` 也应该能根据 atom 的类型推导出 action 的类型。

# 与 react-query 合作

想象一下，如果是使用 recoil 搭配 react-query，写出来的代码会是什么样呢？

```js
const useQueryData = (onSuccess) => useQuery(['queryKey'], queryFn, {
  onSuccess: (data) => onSuccess(data)
})

const Foo = () => {
  const [state, setState] = useRecoilState(atomState);
  
  const { isLoading } = useQueryData((data) => setState(data));
  
  if (isLoading) {
    return <Loader />
  }
  
  return (
    <input value={state} onChange={(e) => setState(e.target.value)} />
  )
}
```

这样在 onSuccess 时赋值，将逻辑和 UI 都写在了组件之中，并且还可能会遇到值被覆盖的问题，因为每个 query 并不能保证是只请求一次的。上面的 atomState 作为表单值，其默认值肯定是希望只设置一次的。你可以基于 `useQuery` 二次封装一个 hook，像这样：

```jsx
const useReactQuery = (queryKey, queryFn, options) => {
  const [fetched, setFetched] = React.useState(false);
  
  return useQuery(queryKey, queryFn, {
    onSuccess: (data) => {
      if (!fetched) {
        options.onSuccessOnce?.(data);
        setFetched(true);
      }
      options.onSuccess(data);
    },
    ...(omit(options, ['onSuccessOnce', 'onSuccess'])),
  })
}
```

但我认为更好的方式是交给状态管理库来做这件事。在 atom() 方法处声明的默认值，只是一个兜底的回退值，每个 atom 都还可以通过一个 init 方法设置一个真正的默认值。而当 init 方法调用成功，再调用 init 则没有作用。这样，就可以将请求结果在 queryFn 中就赋给 atomState，而不用等到 onSuccess，逻辑和 UI 分离地更彻底，也不用担心填写到一半的表单值重新被覆盖的问题：

```jsx
const queryFn = async () => {
  const response = await fetch(/* ... */);
  if (!requestSuccess(response)) {
    throw new Error('请求失败！');
  }
  initStoreState(response); // 在 queryFn 中对值进行初始化
  return response;
}
const useQueryData = () => useQuery(['queryKey'], queryFn);

const Foo = () => {
  const [state, setState] = useStoreState(atomState); // 在组件中可以直接拿来用
  
  const { isLoading } = useQueryData();
  
  if (isLoading) {
    return <Loader />
  }
  
  return (
    <input value={state} onChange={(e) => setState(e.target.value)} />
  )
}
```

# 总结

上面就是我对我理想中的状态管理库的最核心的 api 设计，原子化、有良好的类型支持、拥有与 context 类似的能力从而可以替代 context 的使用、可以尽量让组件只专注于 UI，逻辑维护在另外的地方，并且可以方便地与 react-query 结合。

它的目的是配合 react-query，作为 react 项目状态管理的最后一步，所以我给它取名 `los`，意为 `last one step`。

下一篇文章，我会介绍如何实现这些核心概念。
