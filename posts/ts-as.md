---
title: 'typescript as 关键字实用技巧'
description: 'ts as 的断言、类型转换、重映射键、类型谓词用法'
keywords: 'typescript,前端,as'
date: '2024-01-08T22:32:03+08:00'
tag: 'note'
---

在 ts 中，`as` 常被用作类型断言，但它其实另外还有一些非常实用的技巧。

# as 断言

`as` 关键字常被用作类型断言，即我们主动告诉 ts 编译器，我们确定某个值应该是什么类型。比如：

```typescript
interface Person {
  name: string;
  age: number;
}

let person = {} as Person;
person.name = "Izzy";
person.age = 26;
```

上面的示例中，如果直接为 `person` 指明类型 `Person`，ts 编译器会报错，因为赋值给 `person` 的空对象并没有 `name` 和 `age` 属性。此时就可以先使用 `as` 关键字断言 `person` 类型为 `Person`，这在我们需要一些额外的逻辑动态添加属性时非常好用。

# as + unknown 强制类型转换

`as` 可以作为一个逃生舱，我们可以通过 `as` + `unknown` 进行**强制类型转换**，将某个值修改为你想要的类型：

```typescript
let numberInput = 123;
let stringInput = numberInput as unknown as string;
```

`numberInput` 本来应该是 `number` 类型，通过 `as` 被转换成了 `string`。上面是一个比较刻意的例子，但有时我们确实需要类型转换。

**注意**：在使用 `as` 时，需要我们自行保证类型的正确，因为这样实际上绕过了 ts 类型检查。并且如果我们需要强制类型转换，这可能是类型设计有缺陷的象征。

# as + in 重映射键

`as` 在映射类型的上下文中，可以用来在遍历对象的键时重新映射这些键。

比如，当我们想实现下面的 `PartialKeys` 类型：

```typescript
interface Example {
    a: number;
    b: string;
    c: boolean;
}

// 转换所有键为可选
type AllOptional = PartialKeys<Example>;

// 仅转换 a、b 为可选
type ABOptional = PartialKeys<Example, 'a' | 'b'>;
```

我们可以使用一些 ts 内置的高级类型来实现：

```typescript
// 必选键 & 可选键
type PartialKeys<T, Keys extends keyof T = keyof T> = Omit<T, Keys> &
  Partial<Pick<T, Keys>>
```

使用 `Omit<T, Keys>` 剔除可选属性，得到所有必选属性，再交叉 `Partial<Pick<T, Keys>>` 得到的所有可选属性，就得到了 `PartialKeys` 类型。

如果不使用任何的高级类型的话，我们也可以通过 `as` 来实现：

```typescript
type PartialKeys<T, Keys extends keyof T = keyof T> = {
  [P in keyof T as P extends Keys ? never : P]: T[P]
} & {
  [P in keyof T as P extends Keys ? P : never]?: T[P]
}
```

在 `&` 左边，我们在 `P` 属于 `Keys` 时将 `P` 重新映射为 `never`，从而剔除了可选属性，只设置必选属性的类型；在 `&` 右边，我们反过来，在 `P` 不属于 `Keys` 时将 `P` 重新映射为 `never`，从而剔除了必选属性，只设置可选属性的类型，交叉二者，就得到了 `PartialKeys`。

插句题外话，从上面的例子我们也可以看到 `never` 的作用之一——剔除不想要的类型，比如 ts 内置高级类型 `Exclude` 就是使用 `never` 实现的：

```typescript
type Exclude<T, U> = T extends U ? never : T;
```

# as + is 类型谓词

类型谓词可以仅由 `is` 实现：

```typescript
function isString(str: any): str is string {
  return typeof str === 'string';
}

// 示例
function toUpper(str: any) {
  if(isString(str)) {
		return str.toUpperCase();
  } else {
    console.log('Not a string.')
  }
}
```

通过 `is`，我们在 `if` 处将类型为 `any` 的 `str` 收窄为 `string`。

想象以下场景：后端返回了一个用户列表数组，数组项可能是正常用户和已注销用户——

```typescript
interface BaseUser {
  id: string;
  name: string;
}

// 正常用户，有等级
interface NormalUser extends BaseUser {
  level: number;
}

// 注销用户，有注销 flag 和注销日期
interface ClosedUser extends BaseUser {
  isClosed: true;
  closedDate: string;
}

type User = NormalUser | ClosedUser

type UserList = User[];
```

当我们想展示用户列表的时候：

```tsx
userList.map((user) => {
  // 报错
  if(user.isClosed === true) {
    // 报错
    return <p key={user.id}>该用户已注销，注销时间：{user.closedDate}</p>
  }

  // 报错
  return <p key={user.id}>{user.name} level: {user.level}</p>
})
```

ts 会在 `user.isClosed`、`user.closedDate`、`user.level` 处报错 `Property 'xxx' does not exist on type 'NormalUser | ClosedUser'.`，因为这些属性只存在于某一个分支，另一个分支中不存在。

比较容易想到的是指定 `if` 处的 user 类型：

```tsx
userList.map((user) => {
  if((user as ClosedUser).isClosed === true) {
    // 报错
    return <p key={user.id}>该用户已注销，注销时间：{user.closedDate}</p>
  }

  // 报错
  return <p key={user.id}>{user.name} level: {user.level}</p>
})
```

但这也只能指定 `if` 处的类型，两个分支内的类型还是无法收窄。

这时我们可以使用类型谓词：

```tsx
function isClosedUser(user: User): user is ClosedUser {
    return user.isClosed === true;
}
```

但 `isClosedUser` 中的 `user.isClosed` 依然会报错，因为 user 的类型被指定为 `User`，而我们却调用了 ClosedUser 才有的 `isClosed` 属性。

我们可以将 user 的类型指定为 `any`：

```tsx
function isClosedUser(user: any): user is ClosedUser {
    return user.isClosed === true;
}
```

但这样的话，任何类型的值都可以传给 `isClosedUser`，这并不是个好的方法。这时我们可以结合 `as`，将此处的 `user` 类型转为 `ClosedUser`：

```tsx
function isClosedUser(user: User): user is ClosedUser {
    return (user as ClosedUser).isClosed === true;
}
```

然后替换 `if` 处的条件：

```tsx
userList.map((user) => {
  if(isClosedUser(user)) {
    return <p key={user.id}>该用户已注销，注销时间：{user.closedDate}</p>
  }

  return <p key={user.id}>{user.name} level: {user.level}</p>
})
```

此时 ts 检查不会再报错，两个分支的 user 被收敛为了正确的类型。
