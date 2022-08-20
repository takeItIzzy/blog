---
title: 'react 中的状态管理（四）——实现 los 状态注册和响应系统'
description: '我理想中的状态管理库 los 的状态注册与响应系统实现'
keywords: 'javascript,typescript,前端,react,状态管理,state management'
date: '2022-08-20T02:35:00+08:00'
tag: 'tutorial'
---

# 系列文章

- [react 中的状态管理（一）——社区状态管理方案浅析](/posts/state-management-in-react-1)
- [react 中的状态管理（二）——los 的核心 api 设计](/posts/state-management-in-react-2)
- [react 中的状态管理（三）——响应系统原理](/posts/state-management-in-react-3)
- --> [react 中的状态管理（四）——实现 los 状态注册和响应系统](/posts/state-management-in-react-4)
- [react 中的状态管理（五）——实现 los 其余主要 api](/posts/state-management-in-react-5)

在 [上一篇文章](/posts/state-management-in-react-3) 中，我介绍了响应系统的实现原理。在本文中，我会介绍如何将原子状态注册到 store 中，以及 los 的响应系统——也就是 `useLosValue` 和 `useSetLosState`——的具体实现。

# 状态注册

## 定义 Atom 类

首先我们定义会用到的类型：

```ts
/* reducer 的类型 */
type LosReducer<State, Action> = (state: State, action: Action) => State;
```

接着我们来定义 `Atom` 类。这个类的目的就是记录原子状态的信息，即 `atom()` 的配置项。

```ts
class Atom<T, Action = void> {
  constructor(
    { defaultValue, reducer, cached }:
    {
      defaultValue?: T,
      reducer?: LosReducer<T, Action>,
      cached?: boolean,
    }
  ) {
    this.defaultValue = defaultValue;
    this.reducer = reducer;
    this.cached = cached;
  }
  readonly defaultValue?: T;
  readonly reducer?: LosReducer<T, Action>;
  readonly cached?: boolean;
}
```

`Atom` 接受两个泛型，第一个泛型为 atom 的数据类型，这个泛型是一定存在的；第二个泛型为 reducer 的 action 的类型，由于并不是每个原子状态都会声明 reducer，所以该泛型默认为 void。

## 定义 store

有了 `Atom`，我们就可以写 store 的类型了。 los 的原子状态由 `atom()` 方法声明，并且 los 提供的 hooks 也都接受 `atom()` 返回的状态作为标识。所以我将使用 Map 这种数据结构来定义 store，因为 Map 可以使用对象作为 key，将原子状态本身作为 key，在未来读取值和更新值时会非常方便。value 则存储了原子状态的最新值。所以，store 的数据结构就是这个样子：

```ts
/* store 每一项 value 的类型 */
interface StoreItemValue {
  /* 原子状态的最新值 */
  value: any;
}

const store: Map<Atom<any, any>, StoreItemValue> = new Map();
```

## 实现 atom()

`atom()` 方法需要做两件事：

1. 将当前状态注册到 store 中。
2. 返回这个原子状态，供其它 los 的 api 使用。这个原子状态中，记录了 `atom()` 接受的配置项。

在上面定义 `store` 的时候，对于 store 每一项的 value，其实属性没有写完整。在上一篇文章中我有提到过，需要把数据存入一个桶中，这是实现响应式数据的关键。所以，我们为 store 每一项的 value 添加这个桶属性，每个桶只关心自己所在的原子状态的订阅情况。这个桶使用 Set 类型，这主要是为了利用 Set 的去重能力。桶的每一项都是一个函数，记录了有哪些组件订阅了当前这个原子状态，你可以参照上一篇文章中提到的能使计时器递增的 `subscribe` 方法。

```ts
type SubscribeFn = () => void;
type Bucket = Set<SubscribeFn>;
/* store 每一项 value 的类型 */
interface StoreItemValue {
  /* 原子状态的最新值 */
  value: any;
  /* 依赖收集桶 */
  bucket: Bucket;
}

const store: Map<Atom<any, any>, StoreItemValue> = new Map();
```

另外，每个原子状态还需要有一个更新订阅的方法，用于向桶中添加和移除订阅者，你可以参照上一篇文章中提到的 useEffect 的作用。这个方法接受上面提到的类似上篇文章中递增计时器的 `subscribe` 方法的一个函数，并将其存入 bucket，也返回一个函数，这个被返回的函数用于取消订阅，等效于上一篇文章中提到的 useEffect 的返回值。

```ts
type SubscribeFn = () => void;
type Bucket = Set<SubscribeFn>;
type Subscribe = (subscribeFn: SubscribeFn) => () => void;
/* store 每一项 value 的类型 */
interface StoreItemValue {
  /* 原子状态的最新值 */
  value: any;
  /* 依赖收集桶 */
  bucket: Bucket;
  /* 订阅方法 */
  subscribe: Subscribe;
}

const store: Map<Atom<any, any>, StoreItemValue> = new Map();
```

补全了 store 的类型，我们可以真正开始实现 `atom()` 了：

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
  
  // 这里的 subscribeFn 从何而来，一会儿会介绍到 
  const subscribe: Subscribe = (subscribeFn: SubscribeFn) => {
    bucket.add(subscribeFn);

    return () => {
      bucket.delete(subscribeFn);
    };
  }
  
  // 将原子状态注册到 store 中
  store.set(atomItem, {
    value: atomItem.defaultValue, // 原子状态的值默认为原子状态的默认值
    bucket,
    subscribe,
  });

  // 返回这个原子状态供其它 los api 使用
  return atomItem;
};
```

`atom()` 实现了两个目的——注册状态、返回状态，并且现在可以根据开发者传入的 `defaultValue` 值，或开发者手动声明的泛型推导出原子状态的类型。

# 响应系统

响应系统的实现分为两部分，也就是上篇文章中循环的两部分——读取值时追踪该值和设置值时推送更新。

## useLosValue

`useLosValue` 接受一个原子状态作为参数，在其内部需要做两件事：

1. 返回传入的原子状态的最新值；
2. 采集当前组件到依赖桶中。

我已经介绍过 react18 以前的方案了，现在来说说 react18 提供的 `useSyncExternalStore` hook。

这个 hook 是以前那种使用计数器（或别的类似的东西）forceUpdate 的更新方式的替代品，它保证了外部 store 在 react 中不会出现撕裂问题。它接受两个参数：`subscribe` 方法和 `getSnapshot` 方法。

`subscribe` 方法其实就是在 `atom()` 中声明的那个 `subscribe` 方法，`useSyncExternalStore` 会在合适的时机调用 `subscribe`，并向 `subscribe` 传入 `subscribeFn`，只要状态管理库调用这个 `subscribeFn` 就会让组件重新渲染。现在你就知道 `atom()` 中声明的 `subscribeFn` 是从哪里来的了吧？

`getSnapshot` 其实返回的就是 store 的最新值。但由于 los 是个原子状态库，每个原子状态都是独立的，所以 `getSnapshot` 不需要返回整个 store 的最新值，而只是返回一个原子状态的最新值。但 这个最新值必须是稳定的，这也是它名为 snapshot 的原因，所以我们需要为其包裹 useCallback，并且判断新旧值是否相等，以免返回引用类型时每次渲染引用都不相同。

```ts
const useLosValue = <T, Action = void>(state: Atom<T, Action>): T => {
  const subscribe = store.get(state).subscribe;

  const snapshot = React.useCallback(() => {
    const result = store.get(state).value;
    
    if (isEqual(snapshot.lastResult, result)) {
      return snapshot.lastResult;
    }
    snapshot.lastResult = result;
    return result;
  }, []);

  const value = useSyncExternalStore(subscribe, snapshot);

  React.useDebugValue(value);

  return value as T;
};
```

这样，我们就实现了 `useLosValue` 需要达成的两个目的。并且通过泛型，我们也实现了由接受的原子状态的类型推导出返回值的类型。在 `useLosValue` 返回之前，我使用了 `useDebugValue()` 这个 hook，这将在 react devTools 里打印出这个值，方便开发者调试。

**注意：其实除了这两个参数以外，useSyncExternalStore 还接受额外的参数，主要是用于服务端渲染，与这次的探讨关联性不大，就不多做介绍了。**

## useSetLosState

`useSetLosState` 接受一个原子状态作为参数，并返回一个 setter 方法，在这个方法中，也要完成两件事：

1. 更新 store 中该原子状态的值；
2. 为 store 中该原子状态追踪的组件推送更新。

值得一提的是，其实 `useSetLosState` 内部并不需要依赖任何的 react hooks，所以它其实是一个工具函数，而不是一个 hook，为其添加 `use` 前缀，只是为了使用方式上的统一。所以我会实现一个 `setLosState` 方法，而不是实现 `useSetLosState`。

```ts
type SetStateFunction<T> = (state: T) => T;
type SetLosState<T> = (state: T | SetStateFunction<T>) => void;
const setLosState = <T, Action = void>(state: Atom<T, Action>): SetLosState<T> => {
  // 返回一个 setter
  return (newState: T | SetStateFunction<T>) => {
    const currentAtom = store.get(state);
    const newValue = typeof newState === 'function'
      ? newState(currentAtom.value)
      : newState;
    const lastValue = currentAtom.value;

    // 浅比较新旧值是否相等，不等的话就更新值
    if (!Object.is(newValue, lastValue)) {
      store.set(state, {
        ...currentAtom,
        value: newValue,
      })

      // 向所有该原子状态的订阅者推送更新
      currentAtom.bucket.forEach((subscribeFn) => subscribeFn());
    }
  };
};
```

然后我们给 `setLosState` 一个别名：

```ts
const useSetLosState = setLosState;
```

## useLosState

`useLosState` 其实就是简单地将 `useLosValue` 和 `setLosState` 一起返回而已。

```ts
const useLosState = <T, Action = void>(state: Atom<T, Action>): [T, SetLosState<T>] => {
  const value = useLosValue(state);

  React.useDebugValue(value);

  return [value, setLosState(state)];
};
```

我这里同样使用了 `useDebugValue`，否则开发者需要在 react devTools 中打开 useLosState 才能看到嵌套的 value。

# 总结

这篇文章中，我们通过 `atom()` 方法与 store 的设计实现了状态的注册，还通过 `useLosValue` 和 `useSetLosState` 实现了响应系统。在 [下一篇文章](/posts/state-management-in-react-5) 中，我会为 los 提供不缓存的能力以达到和 context 类似的行为、使用 reducer，以及为 los 提供更方便地与 react-query 结合的能力。
