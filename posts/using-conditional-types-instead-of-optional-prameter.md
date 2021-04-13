---
title: '使用条件类型来替代 interface 的可选属性吧！'
description: '在 typescript 中如何使用条件类型替代 interface 可选属性'
keywords: 'typescript,前端,条件类型,可选属性'
date: '2021-04-13T13:32:05+08:00'
tag: 'experience'
referer:
- name: 'typescript 官网 - 条件类型'
  href: 'https://www.typescriptlang.org/docs/handbook/2/conditional-types.html'
---

`interface` 可以说是 `TypeScript` 最常用的类型之一了。它简单又功能强大，尤其是可选属性的存在，让开发者在面对复杂场景下的数据结构时，可以非常方便地定义接口。

然而，可能很多时候，可选属性都被滥用了。

想象这么一个简单场景——

一个商城网站的商铺有两种类型——官方和第三方。两种类型都包含 `id`, `name`, `storeType` 这几个通用属性，而第三方则多一个 `level` 属性表示该店的等级。此时该如何来为店铺定义类型呢？

首先很容易想到的是可选属性——

```tsx
enum StoreType {
  Official = 'official',
  ThirdParty = 'thirdParty',
}

interface Store {
  id: number;
  name: string;
  storeType: StoreType;
  level?: number; // level 设置为可选
}
```

但是这样写其实是有问题的，`level` 字段变得没有强制性了。如果是官方店，也可以设置 `level`，而第三方也可以不设置 `level`。虽然这样不会有语法错误，但是显然与我们的要求不太匹配。

此时就要用到条件类型了，对于上面的场景，我们可以写成这样——

```tsx
interface BaseStore {
  id: number;
  name: string;
  storeType: StoreType;
}

interface OfficialStore extends BaseStore {
  level?: never;
}

interface ThirdPartyStore extends BaseStore {
  level: number;
}

type Store<T extends StoreType> = T extends StoreType.Official
  ? OfficialStore
  : ThirdPartyStore;
```

这样，我们就可以将 `level` 属性是否存在的两种情况区隔开来。

最后一行代码，就是这次要讲的重点了。条件类型的强大之处在于它可以与泛型结合。

在实际应用时，你可以为使用该类型的函数、hooks、组件等传入一个类型，从而使用不同的 `Store` 类型——

```tsx
const useStore = <T extends StoreType>(type: T): Store<T> => {
  const baseStore: BaseStore = {
    id: 1,
    name: 'store 1',
    storeType: type,
  };

  const store = (type === StoreType.Official
    ? baseStore
    : {
      ...baseStore,
      level: 1,
    }) as Store<T>;

  return store;
}
```
