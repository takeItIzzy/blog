---
title: '讲讲我使用 hooks 踩过的坑'
description: 'react hooks 最佳实践探索'
keywords: 'javascript,前端,react,hooks'
date: '2021-08-27T12:03:30+08:00'
tag: 'experience'
---

# 讲讲我使用 hooks 踩过的坑

## 写在前面

我从做程序员开始就在使用 hooks，到现在已经有一年多的时间了。回顾这一年时间，我几度感到迷茫。因为 react 太灵活了，怎么写都行，最后还都能达到目的。这让我每每陷入纠结之中，react 到底该怎么写更合理？

现在再回头去看，我曾经踏入过很多误区之中，而这些误区，大部分时候来自于对 hooks 的滥用。

> 事先说明，由于 react 的灵活性，事实上现在 react 的写法分出了 n 种“教派”，我所讲的也只是我信服的一种。

## useEffect()

在话题继续进行之前，我想提个问题：下面对于 useEffect() 的依赖数组的理解，哪个更合理？

- 依赖数组中传递我希望监听的数据，当其发生改变时执行 useEffect() 中的逻辑。
- useEffect() 中的逻辑不受依赖数组影响，不论写不写依赖数组，执行 useEffect() 都不会有什么区别，只是写了依赖能让 useEffect() 少执行几次。

react 文档中有一句话说得很好，**你应该将 useEffect() 的依赖当成语义的保证，而不是性能优化的条件。**这句话在 react 的文档上于 useMemo() 的介绍处被提到，但在 useEffect() 中同样适用，事实上，人们更容易在 useEffect() 中犯这样的错误。

useEffect() 从语义上说，就是组件每次渲染都要执行一遍的副作用，表示**每次组件 render 之后，以及组件卸载时希望它做什么**。如果不写依赖数组，那 useEffect() 会在每次组件渲染后都执行；然后通过传入一个依赖数组来决定什么时候让它避免无意义的执行，这叫做**作为性能优化的条件**。

比如一个组件中有三个 state，而一个 useEffect() 中只使用到了两个，那第三个 state 变化引起的组件重绘对于该 useEffect() 而言就是一种噪音而已，此时 useEffect() 即使执行，结果和在这之前它所依赖的两个 state 变化时执行的结果也不会有区别。那就可以添加一个依赖数组，只将被用到的两个 state 写进去，从而避免无关的 state 变化导致 useEffect() 执行。

写 useEffect() 应该先考虑不写依赖数组，保证每次组件 render 时都执行 useEffect() 的逻辑也没问题，然后再考虑加入依赖数组进行性能优化。

而很多人，包括我以前的思维反了，先锁定了依赖数组为何物，然后将 useEffect() 作为监听器，每当依赖数组变化就执行业务逻辑，其实是与 useEffect() 的本意背道而驰了。这种时候，加不加依赖数组，依赖数组中传入哪些值，造成的结果会完全不同，这就是**把依赖数组当成了语义的保证**。本来这样的思想就是错误的，此时再为了补全依赖数组而补全依赖数组，就在错误的道路上越走越远了。

监听器思想在于监听特定字段，这不是一个普适的逻辑，是只为特定字段服务的，那我认为这其实是某个状态变更逻辑的一部分，而不是一种组件渲染的副作用。把 useEffect() 当监听器，带来的结果就是极大概率依赖写不全，因为你只想在某个（某些）字段变化时做相应，而这个响应却不一定只依赖这个（这些）字段。

而把 useEffect() 视作组件渲染后执行的副作用，仅在必要时使用 useEffect()，那 useEffect() 的使用频率会大幅减少（非常大幅），本可以写在事件中的逻辑就放到事件中处理，每当你使用 useEffect()，其依赖也是一定可以写全的。

其实平常写 react 组件，会用到 useEffect() 的机会并不多，其中最常见的就是网络请求。

比如在组件 didMount 的时候请求初始化数据，或者像下面这样的场景——

```jsx
useEffect(() => {
  if(show) {
    fetchData(id).then();
  };
}, [show, fetchData, id]);
```

在点击按钮时才会得到 id，然后弹出一个 Dialog 组件，此时请求数据并进行 Dialog 数据的初始化，这种场景使用 useEffect() 是非常自然的。

但是更多情况下，useEffect() 是被滥用了的。其实 useEffect() 本身就是个不那么常用的 api。可能画个图会更一目了然——

![useEffect() 两种使用思想对比](/posts/my-experience-with-react-hooks-3.jpeg)

大圆是代码中对于是否该用 useEffect() 有争议的场景，小圆是两种思想下都可以使用 useEffect() 解决的需求，也就是上面提到的“普适”逻辑。而剩余的部分，将 useEffect() 作为监听器的思想还是会用 useEffect() 实现，此时就会有依赖无法写全的问题。如果克制使用 useEffect()，仅在小圆的场景下使用 useEffect()，而其余场景在事件中处理，那就不会面对依赖写不全的问题。这里的“事件”不一定就是 onXxx，从事件发起，到变更的状态被更新到 react，这中间有很大的空间可以操作，比如写在 reducer 里。

依据我的经验，useEffect() 大部分时候被用来控制数据流（似乎是句废话）。小圆中 99% 的场景是用来发起网络请求，即 99% 合理使用 useEffect() 的场景是网络请求，这之中有时也会订阅外部数据源，但此时数据往往是单向流动的，也很少对外部数据源做变更（格式化不属于变更，这应该是在与接口对接的缓冲层就做好的事，不会进入数据流中）；大圆中除小圆部分外的常见场景就不同了，不合理地使用 useEffect() 控制系统内部的数据流，这是经验不足的 react 使用者常做的事，此时数据往往是随意流动。不合理地使用 useEffect() 控制数据流是很危险的事情，是导致数据流混乱、架构设计糟糕、带来更多次组件重绘和写出死循环的罪魁祸首之一。

总结起来就是，让本来没必要写在 useEffect() 中的逻辑回归到它们应该在的地方——事件中去，**只在你确定想在每次组件 render 后执行一些“副作用”的时候，才使用 useEffect()**。

可能有人觉得将 useEffect() 作为监听器的写法也没问题，代码一样工作。但是在将来，react 可能会移除依赖数组，让 react 自己判断何时触发 useEffect()，到那时将 useEffect() 作为监听器的思想或许将不再有效。

## useCallback() & useMemo()

useCallback() 和 useMemo() 这两兄弟有一点同 useEffect() 一样，**将依赖数组作为性能优化的条件，而不要作为语义的保证**。先让要缓存的值在没有依赖数组时正常工作，再添加依赖数组以优化性能。

不过除此以外，该在何时使用它俩也是一个经常被讨论的问题。在编写 react 代码时，有相当一部分人只要是方法和数据，都会包裹 useCallback() 和 useMemo()，这样做的思路是，我不想考虑什么时候该用，反正 useCallback() 和 useMemo() 可以优化性能，加了肯定没错。我之前也是这样想的。

那么问题就来了：useCallback() 和 useMemo() 真的总是正确的吗？换句话说，加 useCallback() 和 useMemo() 是为了优化性能，但加了 useCallback() 和 useMemo() 性能一定更好吗？请看下面的代码——

```jsx
const MyComponent = React.memo(() => {
  const [stateA, setStateA] = useState();

  const foo = useCallback(() => { ... }, [stateA]);

  return ...
});
```

上面的代码中，对于 `foo()` 方法使用 useCallback() 是否合理？`MyComponent` 使用 memo 包裹，并且没有 props，也没有 `useContext`，这意味着这个组件的重绘只会由 `stateA` 引起。然后给 foo() 包裹了 useCallback()，将 stateA 作为依赖，这个 useCallback() 就是多余的，每次组件重绘 foo() 都会被重新创建。

可能你的 foo() 方法并不需要依赖 stateA，像这样——

```tsx
const foo = useCallback(() => { ... }, []);
```

但是此时就一定正确吗？如果 foo() 的重新创建并不会导致组件的重绘（稍后我会介绍什么时候会引起重绘），那此时使用缓存的成本会比重新创建 foo() 所付出的成本更高。因为组件并没有因为加了 useCallback() 而减少重绘次数，却平添了使用 useCallback() 的成本，得到的唯一好处是 foo() 函数会被缓存，但是缓存的仅仅是 foo() 而已，传给 useCallback() 的匿名函数在组件每次重绘时还是会被重新创建的。使用缓存的成本是几乎肯定比重新创建一个函数更高的。

执行每一行代码都是有成本的，你调用了一个 useCallback() 函数当然也是如此，而且缓存意味着内存不会被释放。如果使用 useCallback() 的收益无法高于成本，那就是负优化。useMemo() 也是同理。所以说，**useCallback() 和 useMemo() 并不总是正确**。

**很多时候，我们加 memoization 其实是在给自己一个安全感，是*不加怕有问题*，而不是*我知道不加会有问题***。事实上，你并不总是需要 useCallback() 和 useMemo()。

那么什么时候应该使用 useCallback() 和 useMemo()？

### 作为其它 hooks 的依赖

如果你声明一个方法并且没有包裹 useCallback() 就将其作为 useEffect() 的依赖，你的 ESLint 会报这样的错——

> The 'xxx' function makes the dependencies of useEffect Hook (at line xxx) change on every render.

为什么会发生这样的报错呢？因为 hooks 的依赖数组判断是否有值更新的逻辑是浅比较（引用相等）。这在基本类型中很好使，而像一个函数、一个对象这样的引用类型，react 每次重绘都会被重新创建。如果你将一个函数作为了 useEffect() 的依赖，那每次重绘，依赖数组都与旧值不等，这个 useEffect() 会在每次渲染时都被调用，依赖数组失去了意义。

这个时候给函数包裹 useCallback() 就很有必要，在组件重绘的时候函数不会被重新创建，useEffect() 的依赖数组就又变得有效了。

另外，从这里我们还能得到一个知识点——不要直接使用引用类型作为 hooks 的依赖。这样做还不如不写依赖数组，两个是等效的。如果你需要使用一个对象，那就在依赖中精确到具体的值为基本类型的 key；如果确实做不到精确到 key 的话，你可以使用 useRef() 暂存该对象。

### 作为被 memo 的子组件的 props

```jsx
const Parent = () => {
  const [stateA, setStateA] = useState();
  const [stateB, setStateB] = useState();

  const foo = (newState) => {
    setStateA(newState);
  };
  const boo = (newState) => {
    setStateB(newState);
  };

  return (
    <>
      <Child state={stateA} fn={foo} />
      <Child state={stateB} fn={boo} />
    </>
  );
};

const Child = React.memo(({ state, fn }) => {
  return ...
});
```

在上面的代码中，由于 Parent 重绘时两个函数都被重新创建了，Parent 组件的两个 state 无论哪一个发生了变化，两个 Child 都会重绘。虽然子组件使用 React.memo() 包裹，但是 props 却总是在变化，那 memo 其实是没有意义的。

我们只想让受 state 变化影响的的 Child 重绘，那就要给 foo() 和 boo() 加上 useCallback()。

比如 stateA 发生改变，Parent 重绘，此时用到 stateA 的 Child 也会重绘，但是另一个 Child 的两个 props 都没有发生变化，所以不会重绘。

### 编写底层逻辑

如果我们在写一个底层 hooks，或是在写一个 npm 包，并且它会返回一个引用类型的数据，那我们也可能需要为返回的数据包裹 useCallback() 和 useMemo()。我们无法预先得知开发者会如何调用我们的模块，他也许会将其加到别的 hooks 中，也可能传给子组件，我们通常不希望我们写的东西导致使用者的组件发生不必要的重绘，所以会选择把 memoization 做得好一些。

比如我们要写一个网络请求的 hook，这个 hook 会返回一个 run() 方法让开发者手动发起网络请求，那这个 run() 方法就需要缓存起来。网络请求是典型的“副作用”，如果 run() 不进行缓存，开发者将 run 写在 useEffect() 的依赖数组中，会导致 useEffect() 的依赖数组失效。

### 需要存储包含复杂计算的数据

这一点就很好理解了，如果你的数据非常复杂，每次组件重绘要花相当长的时间去执行，那就有必要为其包裹 useMemo()。

所以总结下来，需要使用 memoization 手段的地方就是这四点——

- 作为别的 hooks 的依赖时使用 useCallback() 和 useMemo()
- 作为被 memo 的子组件的 props 时使用 useCallback() 和 useMemo()
- 封装底层逻辑时酌情使用 useCallback() 和 useMemo()
- 需要存储包含复杂计算的数据时使用 useMemo()

### 过早优化是万恶之源

react 其实性能还不错，可能比不上使用模板语法的一些框架，但语言层面的计算依然是很高效的。在实际开发过程中，我更倾向于从来不写 memoization。性能问题就等到性能真的出了问题再解决。即使你不写 useCallback() 和 useMemo() 导致组件出现了不必要的重渲染，那通常也问题不大，并且，如果你的数据流很健康，即使不刻意追求使用缓存减少重绘，也通常不会发生太多次的重绘。

不管三七二十一直接包 useCallback() 和 useMemo() 在一开始就说过了，有弊端，可能造成负优化。而且维护也会有压力，相信每一个写过 useCallback() 和 useMemo() 的同学都遇到过依赖没写全而拿到旧值的 bug 吧？

如果想遵循最佳实践，每声明一个数据或者方法，都考虑它会不会导致组件发生不必要的重绘，要不要包 useCallback() 和 useMemo() 也会带来很大的心智负担。上文中举得反例很简单，但是在实际比较复杂的情况中，一个数据或方法到底需不需要包 useCallback() 和 useMemo() 可能就得想想了。

有一个思想值得注意，**重渲染一般不是造成性能瓶颈的原因，慢渲染才是**。

如果一次重绘的速度很快，那让这个组件重绘三次，也花不了多久时间，完全可以接受。但是如果一次重绘就非常耗时，此时重绘三次就会感觉到卡顿了。

与其把精力放在避免让组件重新渲染上，你的代码库中一定有更重要更值得你去做的事——优化数据结构与算法，少用 O(n^2) 甚至 O(n^3) 的暴力嵌套循环、优化数据流、优化项目架构……这些都比执着于减少一两次重绘要更重要。

### 另一个思路

如果你总在组件中使用 useCallback() 和 useMemo() 意味着什么？这意味着**你的业务逻辑和 UI 耦合了**，你在该写 UI 的地方写了太多的业务逻辑。react 只应该专注于视图，组件的唯一目的就是把 UI 渲染出来，其中处理业务逻辑的代码应该越少越好。想想你的组件中，用于管理 UI 的事件有多少，用于承载业务逻辑的事件又有多少？管理 UI 的事件一般是没必要包裹 useCallback() 的，因为缓存的目的是避免组件重绘，而这种事件的目的就是要改变 UI，就是要让组件重绘。承载业务逻辑的事件更需要包裹 useCallback()，因为你既想执行逻辑，又不希望 UI 变化。使用状态管理库或者 useReducer() 管理业务逻辑和数据才是更好的方式，你见过在这两处地方加 useCallback() 和 useMemo() 的吗？更多时候，useCallback() 和 useMemo() 也不过是一种亡羊补牢的手段罢了，你的数据和方法声明错了位置，数据流一片混乱，再想通过 memoization 来弥补因此引起的组件重绘。

## useState(), useContext(), useReducer()

虽然 useState() 是所有 hooks 中最简单的，不过它可能反而是最被滥用的 hook，没有之一。我把它放到文章的最后一部分，并且结合 useContext() 和 useReducer() 一起介绍，对它们的“改造”可能涉及到代码组织方式整体的大改革。

### 合理使用 useState()

上面刚刚提到过，react 只是**库**，并不是**框架**。它只解决了视图层的问题，声明一个组件，唯一的目的就是把 UI 正确地渲染出来。至于业务逻辑，应该越少存在于组件中越好。

很多时候，我们在组件中塞入了过多的业务逻辑，不仅仅是方法，也包括数据。网络请求、事件、接口所需要的数据等等，都放在一个组件中，本来 react 只应该负责 V（view），却硬要把 VM 往组件里塞，导致业务和 UI 高度耦合。一个组件十几个 state，七八个方法，最终这个组件可能有几百行，对这样的组件进行阅读和维护将会是让人非常痛苦的事。

而更好的办法是给组件减负，**组件的 state 只暂存 UI 相关的临时状态，不负责处理业务逻辑所需要的数据**。

一个 Dialog 组件的开启关闭、一些组件是否挂载的 flag、一个节点的展示值等等，这些都算是 **UI 相关的状态**，从接口请求到的、以及要发送到接口的表单数据则不是。

另外，按照这个逻辑，**组件的方法也只应包括会改变 state 的那些，不包括操作数据的那些**。这里的 state 指的是真正合理的 state。

点击一个按钮打开弹窗，这个事件应该声明在组件中（直接在 JSX 中使用匿名函数是更方便的做法），而一个 input 的 onChange() 事件则不应该。

总之，一个组件中与渲染 UI 无关的东西应该越少越好。

那么那些被“丢弃”的逻辑应该写在哪里？

再强调一遍，react 只是视图库，使用另一个库来管理数据当然是更合理的方式。现在社区有很多优秀的库，目的是为了解决不同的痛点，可以酌情选择。不过大部分时候，我们的业务没有复杂到需要引入一个库，useContext() 和 useReducer() 就可以胜任一部分这个工作。

### 正确看待 useContext()

可能很多同学会听说过，useContext() 有性能问题，不要使用 useContext() 注入可变数据。首先要搞清楚这么说的理由——这是因为当 context 的 value 改变，所有订阅了 context 的组件都会重绘，哪怕你并没有用到被改变的值。

比如一个 context 的 value 有两个键值对 valueA 和 valueB，有两个孙节点 ChildA 和 ChildB 都订阅了这个 context，分别用到了 valueA 和 valueB，见下面代码——

```jsx
const App = () => {
  return (
    <Context.Provider
      value={{
        valueA,
        valueB,
      }}
    >
      ...
    </Context.Provider>
  );
};

const ChildA = () => {
  const { valueA } = useContext(Context);

  return ...
}

const ChildB = () => {
  const { valueB } = useContext(Context);

  return ...
}
```

如果此时 valueA 更新，按理说我们只想让 ChildA 重绘，但是 useContext() 会让 ChildB 也重绘。

这就是“不要使用 useContext() 传递可变数据”这种说法的论据。不能说没有道理，但这种说法却有因噎废食之嫌，不能当作金科玉律。

首先，即使发生几次无关痛痒的重绘，也通常不会造成性能瓶颈，这点在 useCallback() 和 useMemo() 那里已经论述过；其次，useContext() 的这种特性只会在有些时候有问题，比如很多订阅了 context 的组件同时挂载于 DOM，在上面的例子中就是 ChildA 和 ChildB 同时挂载于 DOM。如果你的需求中，ChildA 和 ChildB 并不共存，那使用 useContext() 并没有带来额外的问题；最后，对于 useContext() 会引起无关组件更新的特性，其实是有办法解决的，先让我们来看一段 react 官网介绍 useContext() 时所举的例子，我做了一点改动以适应我要介绍的知识点——

```jsx
const defaultThemes = {
  light: "#dddddd",
  dark: "#222222"
}

const ThemeContext = React.createContext(defaultThemes);

function App() {
  const [themes, setThemes] = useState(defaultThemes);

  return (
    <ThemeContext.Provider value={themes}>
      <Toolbar />
			<Navbar />
      <button
        onClick={() => setThemes(prev => ({
          ...prev,
          light: '#ffffff'
        }))}
      >
        lighter
      </button>
      <button
        onClick={() => setThemes(prev => ({
          ...prev,
          dark: '#000000'
        }))}
      >
        darker
      </button>
    </ThemeContext.Provider>
  );
}

function Toolbar() {
  return (
    <div>
      <ThemedButton />
    </div>
  );
}

function ThemedButton() {
  const { dark } = useContext(ThemeContext);
  return (
    <button style={{ background: dark }}>
      I am styled by theme context!
    </button>
  );
}

function Navbar() {
  return (
    <ul>
      <ThemedNav />
    </ul>
  )
}

function ThemedNav() {
  const { light } = useContext(ThemeContext);

  return (
    <li style={{ background: light }}>
      I am styled by theme context!
    </li>
  )
}
```

Toolbar 中的 ThemedButton 订阅了主题中的暗色，Navbar 中的 ThemedNav 订阅了主题中的亮色，并且有两个按钮分别能让主题中的亮色更亮一点，暗色更暗一点。

当你点击“lighter”按钮时，我们只想让 ThemedNav 变得更亮，不希望 ThemedButton 受影响。不过由于 useContext() 的特性，虽然 dark 主题颜色没有改变，ThemedButton 还是会重绘。

现在我们就来使用下面三种方案，让一个按钮被点击时，只有使用了对应 context 的组件才重绘。

#### 拆分 context

第一种，也是**首选**的方案，不要将使用于不同组件的 context 写在一起，而是将它们分成多个 context。

```jsx
const defaultThemes = {
  light: "#dddddd",
  dark: "#222222"
}

const LightThemeContext = React.createContext(defaultThemes.light);
const DarkThemeContext = React.createContext(defaultThemes.dark);

function App() {
  const [themes, setThemes] = useState(defaultThemes);

  return (
    <LightThemeContext.Provider value={themes.light}>
      <DarkThemeContext.Provider value={themes.dark}>
        <Toolbar />
			  <Navbar />
        <button
          onClick={() => setThemes(prev => ({
            ...prev,
            light: '#ffffff'
          }))}
        >
          lighter
        </button>
        <button
          onClick={() => setThemes(prev => ({
            ...prev,
            dark: '#000000'
          }))}
        >
          darker
        </button>
      </DarkThemeContext.Provider>
    </LightThemeContext.Provider>
  );
}

```

这样，点击“lighter”按钮时，只改变了 `LightThemeContext` 的 value，订阅了 `DarkThemeContext` 的 ThemedButton 就不会重绘了。

> 拆分 context 不一定是为了避免组件重绘的被动为之，如果各数据间彼此没有什么关联，拆分成多个 context 也是更优雅与利于维护的方式。

#### 拆分订阅 context 的组件并使用 React.memo

我们知道，memo 的缓存对于 useContext() 是无效的，即使给 ThemedButton 加了 memo，该重绘还是重绘，所以我们需要将 ThemedButton 拆成两个组件——

```jsx
function ThemedButton() {
  const { dark } = useContext(ThemeContext);
  return <Button theme={dark} />
}

const Button = React.memo(({ theme }) => {
  return (
    <button style={{ background: theme }}>
      I am styled by theme context!
    </button>
  );
});
```

将 context 通过 props 传递给拆分出来的 Button 组件，并将 Button 用 memo() 包裹，该 context 值就不会引起 Button 重绘了。

#### 为订阅 context 的组件包裹 useMemo()

第三种方案的思想和第二种一样，利用缓存避免组件重绘，但是不需要拆分组件——

```jsx
function ThemedButton() {
  const { dark } = useContext(ThemeContext);
  return useMemo(() => (
    <button style={{ background: dark }}>
      I am styled by theme context!
    </button>
  ), [dark]);
}
```

以上三种方案中，拆分 context 最为推荐，不需要改造底层组件，只调整顶层逻辑，并且使用缓存永远是下策。当然，还是那个思想——你不必总是在意组件的重绘，如果通常手段使用 useContext() 没有确实引起性能问题，你根本不必要对 useContext() 做如此改造，尽管大胆去用。

如果你觉得这三种解决方案还是麻烦，那可以考虑引入第三方库，但无论如何，你需要一个 VM，不要什么都往组件里塞。

### 对比

好了，确定了一个组件中应该写什么不应该写什么，也确定了使用 useContext() 为应用派发数据的可行性，最后再加上 useReducer() 就搭建起了一个适用于简单场景的数据管理的架构了，在实际开发过程中，这样的架构也足够解决绝大多数问题。我画了两张图，来对比一个模块经过如此改造前后的区别。

- 改造前

![改造前](/posts/my-experience-with-react-hooks-1.jpeg)

改造前的架构，这个模块的顶层组件中虽然也维护了组件所需的数据，但是并没有起到一个 VM 的作用，这里维护所有的数据只是为了将所有子组件的数据聚合起来，发起网络请求而已。如果这个模块不需要发起 post 请求（比如提交表单），那甚至顶层组件都不会维护 data，直接在每个子组件中请求自己所需的数据。每个子组件也都很重，维护了自己的数据和方法，一个组件可能有几百行，在重构和 debug 时很是折磨人，如果遇到需求变更，改动一处都需要小心翼翼，担心是否动了别的逻辑。本质上来说，顶层组件和每个子组件在组织方式上并没有什么不同，顶层组件仅仅只是处于顶层而已。

- 改造后

![改造后](/posts/my-experience-with-react-hooks-2.jpeg)

改造后的架构，顶层组件为所有的子组件派发数据，子组件只需要关注视图，我约定了一个格式的数据，只要传给我这个格式的数据，我就可以正确渲染 UI，并且我会按照顶层组件约定的方式调用方法来改变 UI。至于这个数据和方法从哪来的，会怎么变化，我并不关心。而对于顶层组件，则是真正起到了 VM 的作用，正确响应变化改变数据，并结合 useReducer() 这个 M 来维护数据，如果有多个相关性弱的子模块存在于该模块中，那还可以使用多个 reducer。在这样的架构下，所有单元各司其职，边界清晰，只用做好自己分内的事，不需要关心其它单元的逻辑，在面对需求变更、重构和 debug 时都可以快速做出反应。

## 最后的建议

这次我分享了关于 useEffect(), useCallback(), useMemo(), useState(), useContext() 的使用心得，对于一些使用起来没什么歧义，反模式大家都很清楚的 hooks，比如 useRef() 和 useReducer() 我则没做太多介绍。

另外我还有一些建议，都是老生常谈的问题，但也是我曾经踩过的坑。

### 单一数据源

还记得我在介绍 useEffect() 时写的反例吗？在那个例子中，我其实不仅对于 useEffect() 的使用方法有错误，还犯了另一个错。我将 props 存到了组件的 state 中，这导致一份数据现在在两处位置被声明，然后我努力使这两处数据源保持同步。这样有可能会让各处的数据不一致，比起单一数据源，更容易导致 bug。props 传进来的值，就直接用吧，不要再存到 state 中去了。如果需要对 prop 做格式化，最好的方式是在组件外进行，因为组件的唯一目的就是渲染 UI，其它多余的逻辑越少越好。如果格式化时需要用到组件内的状态，那可以直接声明一个变量，也好过使用 useEffect() 保持同步。

```jsx
const MyComponent = ({ prop }) => {
  const formattedProp = prop.map(...);

  return ...
};
```

那么这个 formattedProp 是否需要包裹 useMemo() 呢？我的建议是不需要。

### 关注点分离

如果说 react functional 组件比起 classic 组件有哪些优势，更方便提取可复用逻辑一定是最大的优势之一。在函数式组件中，想抽离逻辑只要将它们声明为一个自定义 hook 即可。

但是，声明自定义 hooks 并不只是为了复用逻辑。你可以梳理一下你的组件代码，看看其中的逻辑是不是泾渭分明地分成了几部分，它们彼此之间没有什么联系，只是都被同一个组件使用而已。那就可以把每一个部分都抽离为 hook，这样你的组件代码看起来会清爽很多，有哪些功能一目了然，不像之前各种功能混杂在一起。

而且，当你将逻辑抽离为 hooks 之后，每一个功能点对于组件来说都是一个黑箱。组件不需要关心具体是怎么实现的，只要能知道改变状态的方法以及调用方法的结果就好。这样组织出来的代码，维护起来就像搭积木一样简单——在遇到 bug 的时候，可以更快速地定位问题；如果一个功能需要改到其它组件中，也不需要通读代码找出跟该功能有关的所有代码，直接将这个 hook 剪切粘贴到另一个组件就好。

## 总结

我这次分享的内容，四分之一来自自己的思考，四分之一学习自大佬的文章，还有一半是对 react 官方文档的归纳总结。在刚开始使用 react 的时候，我觉得 react 文档写得很烂，不说人话，概念讲不清楚；再后来我觉得其实该讲的都讲了，只是描述得比较晦涩；现在再看，那些知识人家写得明明白白，是当初的自己太菜了，看不懂。

React is simple, but it's not easy. 这句话说得一点不假，react 成功就成功在它的设计很简约，给予了你非常大的自由，但这份自由，如果没有能力驾驭，将会成为代码混乱的根源。

最近在读 JSON 之父、《JavaScript 语言精粹》的作者道格拉斯·克罗克福德的新书——《JavaScript 悟道》，其在书序中说了这样一句话，分享出来与大家共勉——

> 我其实只是一个普通程序员，只想找到一个最佳实践来写出优美的代码。虽然我的一些想法可能不对，但我也在思考如何纠正这些想法。

希望大家永远谦虚，永远保持学习。
