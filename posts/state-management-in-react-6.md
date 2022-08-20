---
title: 'react 中的状态管理（六）——扩展 los 的 api'
description: '我理想中的状态管理库 los 还有哪些扩展的 api'
keywords: 'javascript,typescript,前端,react,状态管理,state management'
date: '2022-08-20T15:57:00+08:00'
tag: 'tutorial'
---

# 系列文章

- [react 中的状态管理（一）——社区状态管理方案浅析](/posts/state-management-in-react-1)
- [react 中的状态管理（二）——los 的核心 api 设计](/posts/state-management-in-react-2)
- [react 中的状态管理（三）——响应系统原理](/posts/state-management-in-react-3)
- [react 中的状态管理（四）——实现 los 状态注册和响应系统](/posts/state-management-in-react-4)
- [react 中的状态管理（五）——实现 los 其余主要 api](/posts/state-management-in-react-5)
- --> [react 中的状态管理（六）——扩展 los 的 api](/posts/state-management-in-react-6)

在 [上一篇文章](/posts/state-management-in-react-5) 中，我介绍了 los 中围绕 atom 的主要 api 的具体实现，在本文中，我会介绍我还实现了哪些其它的 api。

# storage atom

在有些场景下，可能你希望状态不会随着页面刷新、关闭而被重置，比如存储页面的亮色/暗色模式信息，或是存储用户的基本信息。这时你就需要将其存到 localStorage 或 sessionStorage 中。

我为 atom() 添加了 `storage` 配置项，它的类型如下：

```ts
interface Storage {
  /* 状态值会被同步到哪种 storage 下 */
  type: 'sessionStorage' | 'localStorage';
  /* storage 中的键名 */
  name: string;
}
```

```js
atom({
  defaultValue: 'dark',
  storage: { type: 'sessionStorage', name: 'mode' },
});
```

当开发者为 atom 传入 storage 属性，los 中对该值的一切更新，都会被同步到 storage 里；在注册 atom 到 store 时，也会先访问 storage 中有没有已存在的值，如果有的话，atom 的默认值会是 storage 中的值而不是调用 `atom()` 时传入的 `defaultValue`。

# 派生状态

在 los 中，只有原始的 atom 是存储在 store 内的，其它基于 atom 派生出来的状态都是通过计算得到的，并不存在于 store，这样可以大大减小 store 的体积。

## computed

`computed` 的名字来自 vue。开发者可以在 computed 中对不同 atom 进行格式化，比如进行 atom 之间的聚合、过滤、计算等等，最终返回一个派生值。`computed` 的语法借鉴了 recoil 的 `selector`：

```ts
const atomState = atom({ defaultValue: 1 });
const atomState2 = atom({ defaultValue: 1 });
const computedState = computed({
  get: ({ getAtom }) => {// getAtom 方法的作用与 useLosValue 类似，传入一个 atom，获得其当前值
    const atomValue = getAtom(atomState); 
    const atomValue2 = getAtom(atomState2); 
    return atomValue + atomValue2;
  }
})
```

通过设置 set 属性，可以通过 computed 改变 atom 的值：

```jsx
const atomState = atom({ defaultValue: 1 });
const computedState = computed({
  get: ({ getAtom }) => {
    const atomValue = getAtom(atomState);
    return atomValue + 1;
  },
  set: ({ getAtom, setAtom }, newValue) => {
    setAtom(atomState, newValue - 2); // set 方法作用与 useSetLosState 类似，用来改变 atom 的值；newValue 即为在组件中调用时传入的值
  }
})

const Foo = () => {
  const [state, setState] = useLosState(computedState);
  
  // 点击 button 后，set 的 newValue 值为 5，所以 atom 被设置为 3，而 computed 在 get 中被声明为 4，所以 div 应该展示 `computed: 4`
  return (
    <>
      <div>computed: {state}</div>
      <button onClick={() => setState(5)}>Click me</button>
    </>
  )
}
```

### 实现思路

在 los 底层，我实现了一个 `Computed` 类，它接受开发者声明的 get 和 set 方法，并暴露了读写 atom 的接口 `getAtom` 和 `setAtom`。

一个引用了 computed 的组件，可以等效于引用了这个 computed 内引用的所有原始 atom，当这些原始 atom 有任何一个更新时，引用 computed 的组件就需要更新。所以 Computed 内维护了一个 `originAtoms` 属性，该属性的数据类型是 Set，每当开发者调用 `getAtom`，就将传入的 atom 收集到 originAtoms 中。

在 `useLosValue` 处，需要判断传入的状态是 `Atom` 的实例还是 `Computed` 的实例，如果是 Computed 的实例，`useSyncExternalStore` 接受的 subscribe 方法中，需要遍历 `originAtoms`，将 `subscribeFn` 添加到每一个原始 atom 的 bucket 中，在取消订阅时也需要遍历 `originAtoms`，取消每一个原始 atom 的订阅。

Computed 内声明了一个 getter 方法，它返回了开发者声明的 `get` 方法的返回值。`useSyncExternalStore` 接受的 snapshot 直接读取 Computed 的 getter，不需要从 store 中取值。

Computed 内还声明了 setter 方法，在 `useSetLosState` 中，对值的设置即为调用 setter 赋值。setter 内会调用开发者声明的 `set` 方法，在 `setAtom` 中会将对 atom 的设置更新到 store，并遍历 atom 的 bucket 推送更新。

## shadowAtom

在 jotai 中，可以通过插入一个 Provider，做到一个原子状态在全局是一个值，在这个 Provider 下被覆盖为另一个值。在我负责的项目中，我也需要 los 能提供类似的能力，但又有些不同。在我的业务场景中，我需要即使在这个 Provider 中，也依然可以读到两种值，而不仅是覆盖后的值。所以我设计了 `shadowAtom` 这个 api。

`shadowAtom` 是另一种 atom 的派生状态。它接受一个 atom，并且它的值默认与接受的 atom 保持一致。

```jsx
const atomState = atom({ defaultValue: 1 });
const shadowAtomState = shadowAtom(atomState);

const Foo = () => {
  const atomValue = useLosValue(atomState); // 1
  const shadowAtomValue = useLosValue(shadowAtomState); // 也是 1
}
```

开发者可以手动改变其值，而 atom 原来的值不受任何影响：

```jsx
const Foo = () => {
  const atomValue = useLosValue(atomState);
  const [shadowAtomValue, setShadowAtomValue] = useLosState(shadowAtomState);

  const plusOne = () => {
    setShadowAtomValue(prev => prev + 1); // 两 atom 值为 1 2
  }
}

```

如果当影子 atom 的值与原始 atom 的值不一致时，原始 atom 的值发生变化，影子 atom 会自动同步为 atom 的最新值。开发者可以通过重置影子 atom 的值使其再次与接受的原始 atom 的值保持一致。

```js
shadowAtomState.reset();
```

shadowAtom 还接受第二个参数，传入 `cached` 参数，当 cached 为 false 时，当全局没有任何该 shadowAtom 的订阅者时，shadowAtom 的值会自动回退为原始 atom 的值。

```js
const atomState = atom({ defaultValue: 1 });
const shadowAtomState = shadowAtom(atomState, { cached: false });
```

### 实现思路

#### 如何让 shadowAtom 成为响应式数据

我在 los 底层实现了一个 `ShadowAtom` 类，ShadowAtom 中维护了自己的 bucket。在 `useLosValue` 中，会判断订阅的状态是否为 ShadowAtom 的实例，如果是的话，`useSyncExternalStore` 接受的 subscribe 会将 subscribeFn 加入状态自己的 bucket 中。

ShadowAtom 内维护自己的 value，并声明了 getter 方法返回这个 value，`useSyncExternalStore` 的 snapshot 从 getter 中获取。

ShadowAtom 还声明了 setter 方法，在 `setLosState` 中更新状态时，会调用这个 setter，setter 会更新自己的 value，并遍历自己的 bucket 属性，向订阅者推送更新。

#### 如何在 atom 更新时让 shadowAtom 也更新

这需要改造一下 store 中各状态的属性值。新增一个 `shadowAtoms` 属性。

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
  /* 该原子状态的影子 atom */
  shadowAtoms: Set<ShadowAtom<any, any>>;
}
```

每声明一个 shadowAtom，就向其原始 atom 中追加该 shadowAtom，当原始 atom 更新时（不论是直接更新 atom 还是通过 computed 更新 atom），遍历该 atom 的 shadowAtoms，调用每个 shadowAtoms 的 setter 覆盖 value 为 atom 的值。

# 其它能力

除了这次系列文章中提到的 api，los 还拥有一些其它能力。比如为了提高开发者体验，在开发环境下，会对一些容易出问题的地方提供更具有可读性的错误提示信息；之前封装的 `updateAtom` 是通过 `Object.is()` 对新旧值进行浅比较，los 还提供了注册自定义比较方法的功能，在 updateAtom 中就可以使用自定义方法比较新旧值，从而实现更精准的更新推送。
