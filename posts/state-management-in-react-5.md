---
title: 'react 中的状态管理（五）——实现 los 其余主要 api'
description: '我理想中的状态管理库 los 的除核心状态注册 api 外其余主要 api 的实现'
keywords: 'javascript,typescript,前端,react,状态管理,state management'
date: '2022-08-20T14:38:00+08:00'
tag: 'tutorial'
---

# 系列文章

- [react 中的状态管理（一）——社区状态管理方案浅析](/posts/state-management-in-react-1)
- [react 中的状态管理（二）——los 的核心 api 设计](/posts/state-management-in-react-2)
- [react 中的状态管理（三）——响应系统原理](/posts/state-management-in-react-3)
- [react 中的状态管理（四）——实现 los 状态注册和响应系统](/posts/state-management-in-react-4)
- --> [react 中的状态管理（五）——实现 los 其余主要 api](/posts/state-management-in-react-5)
- [react 中的状态管理（六）——扩展 los 的 api](/posts/state-management-in-react-6.md)

在 [上一篇文章](/posts/state-management-in-react-4) 中，我介绍了 los 中状态注册和响应系统的实现。在本文中，我会介绍剩余主要 api 的具体实现，包括不缓存的 atom、reducer 的使用，以及在 queryFn 中注册状态。

# 不缓存的 atom

通过给 `atom()` 方法传入 `cached = false` 的配置项，使得当全局没有该原子状态的订阅者时，los 可以重置该状态的值。

```js
const atomState = atom({
  defalutValue: 1,
  cached: false,
})
```

判断一个原子状态有多少订阅者，就是看其 `bucket` 中有多少个 `subscribeFn`。而增减 subscribeFn
 的逻辑是写在每个 atom 的 `subscribe` 方法中的，所以这个判断就是在 subscribe 中执行。

```ts
const atom = <T, Action = void>(
  config: {
    defaultValue?: T;
    reducer?: LosReducer<T, Action>;
    cached?: boolean;
  }
): Atom<T, Action> => {
  const { defaultValue, reducer, cached = true } = config ?? {};

  const atomItem = atomItem = new Atom({ defaultValue, reducer, cached });

  const bucket: Bucket = new Set();

  const subscribe: Subscribe = (subscribeFn: SubscribeFn) => {
    bucket.add(subscribeFn);

    return () => {
      bucket.delete(subscribeFn);
      
      // 每次移除订阅者后，判断是否所有订阅者全部被移除，是的话就重置状态值
      if (bucket.size === 0 && !atomItem.cached) {
        store.set(atomItem, {
          ...store.get(atomItem),
          // atomItem 中一直存储着声明该状态时的默认值，在这里将 store 中的值重置为此值
          value: atomItem.defaultValue,
        })
      }
    };
  }
  
  // atom() 中其它逻辑
  // ...
}
```

按理说只要有对 store 中原子状态 value 的更新操作，后面就应该立马遍历 bucket 中的 subscribeFn 推送更新，只有这里是例外，因为此时 bucket 已经空了。

# useLosDispatch

声明了 reducer 方法的原子状态，可以通过 `useLosDispatch` 来使用对应的 dispatch 方法。同 `useSetLosState` 一样，`useLosDispatch` 也不是真正的 hook，所以我们先实现 `losDispatch`：

```ts
type LosDispatch<Action> = (action: Action) => void;

const losDispatch = <T, Action = void>(atomItem: Atom<T, Action>): LosDispatch<Action> => {
  if (!atomItem.reducer) {
    throw new Error('请为 atom 添加 reducer 后再使用 dispatch');
  }
  
  return (action) => {
    const currentState = store.get(atomItem);
   // reducer 在 atom() 中被存入了 Atom 里，这里为 store 赋值为 reducer 函数的返回值
    const newValue = atomItem.reducer(currentState.value, action);
    
    if (!Object.is(currentState.value, newValue)) {
     store.set(atomItem, {
      ...currentState,
      value: newValue,
     })

     // 设置值后推送视图更新
     currentState.bucket((subscribeFn) => subscribeFn());
    }
  };
};
```

其实可以看到，在任何对状态的设置的方法中，在设置完状态的新值后，都需要向视图推送更新，所以我们可以将这两步封装成一个方法，在每个更新状态的方法中调用。

```ts
const updateAtom = <T, Action = void>(atomItem: Atom<T, Action>, newStoreItemValue: Partial<StoreItemValue>) => {
 const { value } = newStoreItemValue;

 const currentState = store.get(state);
 if (!Object.is(value, currentState.value)) {
  store.set(atomItem, {
    ...currentState,
   value,
  })

  currentState.bucket((subscribeFn) => subscribeFn());
 }
};
```

上面的 `losDispatch` 就可以重构为：

```ts
const losDispatch = <T, Action = void>(atomItem: Atom<T, Action>): LosDispatch<Action> => {
  if (!atomItem.reducer) {
    throw new Error('请为 atom 添加 reducer 后再使用 dispatch');
  }
  
  return (action) => {
    const currentState = store.get(atomItem);
   // reducer 在 atom() 中被存入了 Atom 里，这里为 store 赋值为 reducer 函数的返回值
    const newValue = atomItem.reducer(currentState.value, action);

   updateAtom(atomItem, newValue);
  };
};
```

`setLosState` 方法也可以同样使用 `updateAtom` 进行重构。

最后我们再为 `losDispatch` 赋一个别名：

```ts
const useLosDispatch = losDispatch;
```

# initLosState 实现思路

`initLosState` 其实实现与 `setLosState` 非常相似，只是 `initLosState` 仅可被执行一次。

所以我们需要为 store 每个 atom 的信息中添加一个 `hasInit` 的 flag，默认为 false：

```ts
interface StoreItemValue {
  /* 原子状态的最新值 */
  value: any;
  /* 依赖收集桶 */
  bucket: Bucket;
  /* 订阅方法 */
  subscribe: Subscribe;
  /* 是否完成了初始化 */
 hasInit: boolean;
}
```

然后在 `initLosState` 中判断 hasInit 的值，只有为 false 才执行接下来的逻辑，并且执行完将 flag 设置为 true 即可。

除了 `initLosState`，`setLosState` 和 `losDispatch` 中在更新值时，也需要无脑把 hasInit 设为 true，因为当一个状态已经开始更新值了，那它肯定已经是初始化完成的状态了。

# 总结

本文介绍了围绕 atom 的其它一些主要功能的实现，在 [下一篇文章](/posts/state-management-in-react-6) 中，我会介绍除了 atom，我还为 los 开发了哪些 api，以及它们的实现思路是怎样的。
