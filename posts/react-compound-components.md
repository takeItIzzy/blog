---
title: 'react 复合组件'
description: '使用复合组件模式替代传统组件封装'
keywords: 'javascript,前端,react,hooks,复合组件,compound components'
date: '2021-10-31T02:35:30+08:00'
tag: 'note'
---

# react 复合组件

Compound Components，复合组件，指的指通过一系列组件的组合，来实现一个完整的功能。比如，html 的 `<select>` 和 `<option>` 就是一组典型的复合组件——

```html
<select>
  <option value="value1">option1</option>
  <option value="value2">option2</option>
  <option value="value3">option3</option>
</select>
```

`<select>` 标签和 `<option>` 标签二者谁脱离另一方使用都没有什么意义，而两者组合就实现了“对值的选择”这一功能。

另外值得注意的一点是，在使用这两个标签时，我们并没有显式地为其存储一个选值，select 隐式地存储了值。

react 同样可以使用这种思路来对组件进行封装。在平时开发工作中，我们经常会遇到这样的需求——在一个元素后跟一个提示信息的小图标，这个元素可以是一个普通的文本，可以是表单元素，或是其它任何需要的类型。当点击小图标或是鼠标悬于图标之上，会弹出气泡展示提示信息。元素和尾随图标共同构成了提示信息的功能，这种情况就很适合使用复合组件的模式来设计组件。

# 普通组件与复合组件的对比

首先来看看使用普通的封装组件的模式实现的尾随图标组件是如何被使用的——

```jsx
const App = () => {
  return (
    <WithTips
      trigger="hover" // 鼠标悬浮于图标之上时触发气泡弹出
      icon="help" // 图标是一个小问号
      tips="密码在 8 到 16 位之间，需至少包含 1 个大写字母，1 个小写字母和 1 个符号" // 气泡中的文案
    >
      请输入密码
    </WithTips>
  );
};
```

下面是一个应用了复合组件模式的尾随图标组件的用法——

```jsx
const App = () => {
  return (
    <WithTips>
      <WithTips.Content>请输入密码</WithTips.Content>
      <WithTips.Tips trigger="hover" icon="help">
        密码在 8 到 16 位之间，需至少包含 1 个大写字母，1 个小写字母和 1 个符号
      </WithTips.Tips>
    </WithTips>
  );
};
```

`WithTips` 作为容器，`WithTips.Content` 是主要元素，`WithTips.Tips` 是尾随的图标。你肯定已经注意到了有些组件中间的 `.`，这其实是把附属于 `WithTips` 组件的子组件作为了 `WithTips` 的静态方法。这对于复合组件来说不是必须的，但却可以更明显地表示组件之间的关系。

# 复合组件的优势

上面的两个代码示例作用是完全相同的，都能很好地完成需求。复合组件说白了就是更细粒度地拆分组件，本来是一个大组件，拆成几个小的进行调用。事实上，没有哪一个需求是一定非要写成复合组件的模式不可的。但是复合组件有它自己的优势——

- 复合组件结构更清晰。对比两段代码示例，使用复合组件的代码，可以一眼看出先声明了一个文本元素，在其后跟随了一个提示信息；而普通模式仅凭几个 props 无法得知其最终会渲染出什么样的结构。
- 复合组件具有更加灵活的 API。如果我们想自由控制内容和提示两处的样式，对于普通组件，我们要分别声明 `contentClassName` 和 `tipsClassName` 两个 props。那如果以后还要添加别的元素呢？比如再加一个次级文案，文字更小，颜色更浅，那还要再声明一个 `minorContentClassName`…慢慢迭代下去，这个组件会变得非常丑陋且难用。而对于复合组件，则只要给 `WithTips.Content`、`WithTips.Tips` 添加 className 即可，后面如果要添加新功能，也只需要再声明一种新的子组件，并为其添加 className。
- 复合组件具有更强的可定制性。如果在某一个地方，需要把提示的小图标放在文案的前面而不是后面，普通组件也许要再加一个 `reverse` prop，并在组件的实现里适配两种样式，那如果后面还会有更多可能的样式呢？而对于复合组件，只要在调用的时候把 `WithTips.Content` 和 `WithTips.Tips` 的位置互换一下就行了。如果一个地方要同时展示 label 和表单组件，普通组件可能要自己控制 children 的布局，复合组件只需要调用两次 `WithTips.Content` 就行。如果是针对某个地方特殊处理的样式，不必加在组件中的情况，复合组件也只需要直接将另一个组件插入任意位置即可，普通组件如果没暴露对应 api，可能无法完成这种定制需求。

# 实现一个有状态的复合组件

像上面的 `WithTips` 组件比较简单，只是渲染了两个不同的元素，并不用管理状态，而有的组件是需要管理状态的。

复合组件将一个功能拆分成了数个子组件来完成，优势是更灵活，代价则是增加了组件间通信的成本。如果用普通的 state + prop 的模式，数据流会比较混乱，使用者在把值传来传去的时候也会觉得这样的组件难用，好在我们有 `useContext()`。

下面我来实现一个 `CheckList` 组件，它包含一系列勾选框，会记录当前哪些值被勾选。

> 以下代码示例仅用来介绍如何设计一个符合复合组件模式的组件，并非组件抽象的最佳实践。

```jsx
const CheckListContext = React.createContext({
  checkedItems: [],
  onToggleItem: () => {},
});

const CheckList = ({ children, className, onChange }) => {
  const [checkedItems, setCheckedItems] = useState([]);

  const handleToggleItem = (itemNeedsToBeToggled) => {
    const newItems = checkedItems.includes(itemNeedsToBeToggled)
      ? chechedItems.filter(item => item !== itemNeedsToBeToggled)
      : checkedItems.concat(item);

    setCheckedItems(newItems);
    onChange(newItems);
  };

  return (
    <CheckListContext.Provider value={{
      checkedItems,
      onToggleItem: handleToggleItem
    }}>
      <div className={className}>
        {children}
      </div>
    </CheckListContext.Provider>
  );
};
```

上面是整个 `CheckList` 的容器，提供了 context 供子组件使用，并且可以通过 `onChange` 方法向外界暴露内部维护的已勾选值，而对于值是如何在几个组件之间被传递的，外界没有感知。

在上面的示例中，我声明了一个 `handleToggleItem()` 方法用来向接口暴露状态，以及更新内部状态。对于习惯把 `useEffect()` 作为监听器的同学，可能会奇怪为什么不使用 `useEffect()` 每当 `checkedItems` 变化就调用 `onChange()`，但我建议你不要这么做，理由可以看我的[这篇文章](/posts/my-experience-with-react-hooks)。

让我们继续完成这个组件。

```jsx
const Item = ({ value, children }) => {
  const { checkedItems, onToggleItem } = useContext(CheckListContext);

  const checked = checkedItems.includes(value);

  return (
    // 为了提高体验，把点击事件放在了最外面而不是勾选框上，
    // 这样用户点击一行中的任意位置都会触发勾选和取消勾选事件了
    <div onClick={() => onToggleItem(value)}>
      <Combination>
        <Combination.Content>
          <Checkbox checked={checked} />
        </Combination.Content>
        <Combination.Content className="cursor-pointer">
          {children}
        </Combination.Content>
      </Combination>
    </div>
  );
};
```

上面的代码中又调用了一个复合组件 `Combination`，它其实就等效于我们一开始示例中的 `WithTips`，只不过这里不需要尾随气泡，而是勾选框和对应文案两个平等的元素，所以改了个名，表示这个复合组件的作用是把几个元素联合在一起。

`Checkbox` 组件的实现不是本篇博客的重点，我就不讲它的实现了。

这样我们就实现了一个简单的 `CheckList` 组件。这个组件现在已经可以使用了，不过还差了最后一步，那就是把 `Item` 组件声明为 `CheckList` 组件的静态方法，这步是可选的，但这样做可以在调用时更清晰地表达组件间的父子关系。

```jsx
CheckList.Item = Item;
```

使用方法：

```jsx
const App = () => {
  return (
    <CheckList onChange={(checkedItems) => {
      console.log(checkedItems);
    }}>
      <CheckList.Item value="value1">label1</CheckList.Item>
      <CheckList.Item value="value2">label2</CheckList.Item>
      <CheckList.Item value="value3">label3</CheckList.Item>
    </CheckList>
  );
};
```

现在当你点击了第一个和第三个 `Item`，`onChange()` 函数应该会打印 `[‘value1’, ‘value3’]`。`CheckList` 内部维护了状态，而调用者完全不用自己管理状态。

以后如果遇到“几个组件共同实现一个功能”的需求，不妨把本来习惯的声明一个大组件的方式改为复合组件的模式，通过更细粒度地拆分组件，来更加灵活地应对未来频繁变更的需求吧！