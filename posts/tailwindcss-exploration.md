---
title: 'tailwindcss 探索'
description: '一篇文章学会最流行的 css 框架——tailwindcss 九成知识。'
keywords: 'javascript,前端,css,tailwind,tailwindcss'
date: '2021-01-26T19:04:30+08:00'
tag: 'tutorial'
referer: 
  - name: 'tailwindcss 官网'
    href: 'https://tailwindcss.com/'
---

![tailwind 语法一览](/posts/tailwindcss-exploration-1.png)

## 一、什么是 tailwindcss

### 1. 一句话概括

> tailwindcss 是一个 `utility-first` 的 CSS 框架，可以将各种原子类进行组合搭配，来快速构建页面。

关于什么是 `utility`，什么又是 `utility-first`，这里我先卖个关子，会放到后面解释。

### 2. 本质

**tailwindcss 的本质是一个 PostCSS 插件**。

PostCSS 相信大家没用过也听说过，它通过 JS 扩展了原生 CSS 的能力。它是一个平台，提供了一些 api，开发者可以基于它来开发各种插件。有些插件可能你已经使用过，只是你并不知道它们的底层其实就是 PostCSS。比如 `Autoprefixer`，这是一个可以根据 JS 执行环境自动为 CSS 添加兼容性前缀的工具。

其它有名的插件还有 `StyleLint`、`CSSNext` 等。

## 二、核心概念

### 1. UTILITY

在开始的一句话概括中说到，tailwindcss 是一个 `utility-first` 的 CSS 框架，那么，什么是 `utility` 呢？

`utility` 就是指 tailwind 提供的一系列原子类。

![tailwind 语法一览](/posts/tailwindcss-exploration-1.png)

上图是官网中的一个示例，其中就用到了一些 `utilities`，比如 `p-6` 是指 `padding: 1.5rem`，`bg-white` 是指 `background-color: white`，`h-12` 是指 `height: 3rem`。tailwind 的后缀（spacing）以 `rem` 或百分比为单位，4 spacing 为 1 rem。所有可以设置 rem 或百分比为值的 CSS 属性，其对应的 `utility` 都可以添加对应的 spacing。

tailwindcss 提供了数以千计的 `utilities`，其中大部分都是为了囊括大量描述刻度值的后缀。比如一个 `width` 属性，其默认对应的 `utility` 包括了从 `w-1` 到 `w-96`，还有 `w-full` `w-1/2` 这样的值。虽然这些后缀并不是连续的从 1 到 96，而是跳着提供的，但是也非常繁多了。好在最后打包时，tailwindcss 会将没有用到过的 `utilities` 从打包文件中剔除，而留下被使用过的 `utilities`，只要你保证 `utilities` 的完整——

对于写 `jsx` 的同学，**不要拆分 utilities**：

```jsx
<button className={`bg-${error ? 'red' : 'green'}-500`}>example</button>
```

而是这样

```jsx
<button className={error ? 'bg-red-500' : 'bg-green-500'}>example</button>
```

这样举例比较脱离实际，相信大部分同学都会写成下面这种实现。不过思考一下这样一个很常见的真实场景——一个 tab 组件，以 `ul` 列表实现，每个 tab 分页是一个 `li`，这些 tab 分页下有个滑块展示当前在哪页。点击 tab 分页，滑块会有一个位移的动画，移动到新的当前页下方。

这个需求，你会怎么写？给个提示，tailwind 支持 `translate-x-full` 这样的属性，表示横向位移 100%，你也可以自定义诸如 `translate-x-2full`、`translate-x-3full` 来表示横向位移 200%、300%。你的第一想法，是写成 `translate-x-${currentTranslate}` 还是保证 utility 的完整性呢？

tailwind 在打包时会全局检索 utilities，如果你使用模板字符串来动态设置某个 utility，并且其它地方也没有用过这个 utility 的话，那 tailwind 就会将该 utility 剔除。所以你有时候可能不得不写出这样的代码——

```jsx
<ul className="relative w-96 m-auto flex justify-center items-center">
  {list.map((item, index) => (
    <li
	 key={item.id}
	 className="w-32"
	 onClick={() => setCurrentTab(index)}
	>
	  {item.title}
	</li>
  ))}
  <div
    className={classNames('absolute left-0 bottom-0 w-32 h-2px bg-black transform transition-all', {
	  ['translate-x-0']: currentTab === 0,
	  ['translate-x-full']: currentTab === 1,
	  ['translate-x-2full']: currentTab === 2,
	})}
  />
</ul>
```

这里我借助了 `classnames` 这个高效的库来使事情变得简单一些，但这种写法多少还是有点难受，好在你很少会遇到这样的情况。

#### 1.1. 为什么使用 utilities？

这样通过 `utilities` 设置 CSS 样式的写法第一眼看上去有一些凌乱，结构不是很明显，但是官方给出了这样写样式的三点好处——

- 不用再绞尽脑汁去想 class 名。虽然类名确实可以一定程度上起到加强可读性的作用，但是很多时候，为一个抽象的元素起类名是非常令人头痛的。而且不使用类名所带来的可读性降低的问题，也可以通过别的方法来优化。比如将组件进行更细粒度的拆分，以及使用语义化标签等等，这样其实反而会反向推动代码可读性和可访问性；

- CSS 将停止增长。当使用传统方法添加样式时，每次编写新特性，CSS 文件都会变大，而使用 `utilities`，你几乎不用再额外编写 CSS。另外，所有的类都是复用的，每个 CSS 属性最终最多只会存在一份，在打包时，没有用到的 `utilities` 不会被打包进源代码中，事实上，最终打包出的 CSS 很少会超过 10k；

- 可以更安全地改变样式。CSS 是全局的，当改变样式时，我们很难知道这样做会破坏哪里，你只能不厌其烦地给那些类名加前缀，或是使用 `CSS-Modules` 以及  `styled components` 这样的 `css-in-js` 库来为 CSS 代码添加唯一标识。而 `utilities` 是本地的，所以可以放心地改变样式。

可能会有人觉得这和写内联样式没什么区别嘛，确实，在最基础的设置样式上，utilities 好像和内联样式没什么区别，但 utilities 还有一些独有的优势——

- 样式容易得到约束。没错，以 `rem` 为单位，并且要使用 tailwind 提供的（不论是默认提供还是使用者自定义）后缀来写样式，在 tailwind 官方看来，并不是一个“使用不够灵活”的缺点，而是“容易规范样式”的优点。使用内联样式，可能每个地方都写的不一样，而 utilities 在哪里都使用同一套原子类，更容易使 UI 保持视觉一致。如果你觉得这样的限制使你不能自由发挥，或是完美还原设计稿，可能你要考虑一下设计上的规范性问题了。

- 更方便写响应式设计。内联样式是无法写响应式布局的，而 utilities 可以通过添加如 `md`、`lg`、`xl` 这样的前缀来非常方便地编写响应式布局。

- 更方便添加伪类。内联样式同样无法使用 `hover`、`focus`、`first-child` 等伪类，这些也可以通过向 utilities 添加前缀的方式轻松做到。

除此以外，使用 utilities 还有一些别的优点，比如有的 utilities 提供了几个 CSS 属性的组合能力，像 `divide-x` 可以快速添加横向分割边框，`truncate` 可以将一段文字只显示一行并且结尾添加省略号，等等。再比如你可以更方便的添加 CSS 变量，这在使用主题色的时候特别有用，只要你在 `tailwind.config.js` 中配置即可，这个我稍后会讲到。

### 2. VARIANT

第二个非常重要的概念就是 `variant`，可以说 `utility` + `variant` 基本上就组成了 tailwind。

variant 就是 tailwind 提供的一系列前缀，后跟 `:` 字符，再拼接 utility，以达到对应目的。

下面将介绍几大类重要的 variant。

#### 2.1. 响应式设计

tailwind 中的每个 utility 都可以选择性地应用于不同的断点。默认情况下有 5 个断点，也是各类常见设备的分辨率——

|断点前缀|最小宽度|CSS|
|---|---|---|
|`sm`|640px|`@media (min-width: 640px) { ... }`|
|`md`|768px|`@media (min-width: 768px) { ... }`|
|`lg`|1024px|`@media (min-width: 1024px) { ... }`|
|`xl`|1280px|`@media (min-width: 1280px) { ... }`|
|`2xl`|1536px|`@media (min-width: 1536px) { ... }`|

在上面的表格中，只列出了 `最小宽度` 而没有 `最大宽度`，这也就意味着，在较小断点上设置的样式会延续到更大的断点，你只需考虑样式从何时开始，而不用考虑它在哪里结束。如果你想在更大断点上使用新样式，只需添加新的前缀来覆盖样式。

**未加前缀的 utility 对所有宽度都有效，加前缀的 utility 只对其前缀指定断点及以上断点有效，并且级别更大的前缀会覆盖之前的 utility**。

下面举一个简单的例子来说明——

```html
<div class="h-24 w-12 md:w-24 xl:h-48 xl:w-48"></div>
```

1. 当页面宽度在 `0 ~ 639px` 时（手机），不加前缀的 `h-24` 和 `w-12` 会被应用，此时 `div` 为一个长宽比为 2 : 1 的长方形；

2. 当页面宽度为 `640px ~ 767px` 时，宽度达到 `sm` 前缀的范围，但是由于没有任何 utility 添加 `sm` 前缀，所以还是沿用未添加前缀时的样式，此时 `div` 和之前一样；

3. 当页面宽度为 `768px ~ 1023px` 时（iPad 等），`md` 前缀被触发，之前设置的宽度被覆盖，此时 `div` 为一个长宽均为 `24` spacing 的正方形，默认是 `6rem`；

4. 当页面宽度为 `1024px ~ 1279px` 时（iPad pro 等），由于没有添加 `lg` 前缀的 variant，所以还是沿用 `md` 时的样式，此时 `div` 依然为一个长款均为 `24` spacing 的正方形，默认是 `6rem`；

5. 当页面宽度为 `1280px ~ 1535px` 时（笔记本），`xl` 前缀被触发，长度和宽度都被覆盖，此时 `div` 为一个长款均为 `48` spacing 的正方形，默认是 `12rem`；

6. 当页面宽度大于 `1536px` 时（显示器），宽度达到 `2xl` 的范围，但是由于没有任何 utility 添加 `2xl` 前缀，所以还是沿用 `xl` 时的样式。

这里值得一提的是，当你初次使用 tailwind 为手机写样式时，你可能会以为 `sm` 就是小屏幕的意思，所以为手机端的样式添加 `sm` 前缀。注意，`sm` **不是**指“在小屏幕上”，而是指“在小的断点上”。因为一般手机宽度也就三百多 px，未达到 `sm` 断点，所以当为手机端写样式时，你不需要添加任何前缀。

**不要**这样锁定手机端样式：

```html
<!--这样只会在宽度大于 640px 的屏幕生效，而不是小屏幕-->
<div class="sm:text-center"></div>
```

而是这样：

```html
<!--这样文字会在手机端居中，在宽度大于 640px 的屏幕靠左-->
<div class="text-center sm:text-left"></div>
```

出于这种样式被从小到大逐级覆盖的设计理念，优先为移动端设计样式是个好主意，然后再逐级改变样式直到大屏幕，这就是 tailwind 响应式设计**移动端优先**的设计理念。

注意，如果你需要将其它 variant 与响应式 variant 配合使用，请保证永远先添加响应式 variant，再添加别的 variant，如：

```html
<button class="hover:bg-green-500 sm:hover:bg-blue-500">
  button
</button>
```

#### 2.2. Hover, Focus 和其它状态

tailwind 另一大非常实用的 variant 就是一些 CSS 状态。

同响应式设计一样，当你想为某个元素处于 hover、focus 或是其它状态时添加不一样的样式，只需要在对应的 utilities 前添加 `hover`、`focus` 等各种前缀即可。

一些常用的状态——

hover:

```html
<!--该按钮在平时背景色为 #ef4444，hover 时背景色为 #b91c1c-->
<button class="bg-red-500 hover:bg-red-700">
  Hover me
</button>
```

focus:

```html
<!--该输入框会在聚焦时出现一个宽 2 px，颜色为 #2563eb 的 box-shadow-->
<input class="focus:ring-2 focus:ring-blue-600">
```

first-child:

```jsx
// 此时第一个 li 会旋转 45°
<ul>
  {items.map((item) => 
    <li className="w-12 h-12 transform first:rotate-45">
	  <div />
    </li>
  )}
</ul>
```

**除了以上伪类，tailwind 还支持很多别的状态，并且并不是默认所有属性都可添加这些 variant 的；而有的伪类 tailwind 却不支持，比如 `nth-child`、`before` 和 `after`。你可以去 [tailwind 官网](https://tailwindcss.com/docs/hover-focus-and-other-states) 查看更多支持的状态以及每个 variant 默认支持的属性。**

#### 2.3. 深色模式

现在许多操作系统开始力推深色模式，为网站添加深色模式也成为一个潮流。tailwind 也提供了 `dark` variant，并可以通过两种方式来方便开发者为网站添加深色模式——

- 跟随系统

  只要系统启用了深色模式，添加了 `dark` variant 的 utilities 就会被应用，如：

  ```html
  <!--系统为亮色，背景为白色，标题深灰，段落浅灰；系统为深色，背景深灰，标题白色，段落浅灰-->
  <div class="bg-white dark:bg-gray-800">
    <h1 class="text-gray-900 dark:text-white">Dark mode is here!</h1>
    <p class="text-gray-600 dark:text-gray-300">
      Lorem ipsum...
    </p>
  </div>
  ```

  注意，tailwind 默认不开启深色模式，需要手动在 `tailwind.config.js` 中启用，跟随系统需要将 `datkMode` 选项设置为 `media`：

  ```js
  // tailwind.config.js
  module.exports = {
    darkMode: 'media',
    // ...
  }
  ```

- 自定义开关

  如果你想通过开关控制深色与亮色，而不是跟随系统，你需要将配置文件中的 `darkMode` 设置为 `class`：

  ```js
  // tailwind.config.js
  module.exports = {
    darkMode: 'class',
    // ...
  }
  ```

  然后你需要为 `html` 元素添加一个名为 `dark` 的类：

  ```html
  <html class="dark">
  <body>
    <!-- 当 html 元素有 dark 这个类时，带有 dark variant 的样式就会生效 -->
    <div class="bg-white dark:bg-black">
      <!-- ... -->
    </div>
  </body>
  </html>
  ```

注意，如果你需要将其它 variant 与深色 variant 配合使用，请保证深色 variant 永远只排在响应式 variant 之后，而在其它 variant 之前，如：

```html
<button class="lg:dark:hover:bg-white">
  button
</button>
```

深色模式默认只应用在与颜色相关的 variant 上，如背景色、文字颜色、边框颜色、占位符颜色等。

### 3. 指令

上面讲的 `utility` 和 `variant` 理解起来比较容易，你使用它们也可以完成大部分的需求了，但还有一些情况不是通过简单地堆砌已有的 utilities 就可以实现的，这时候就需要我们自己来写一些类了，`指令` 就是帮助我们来实现这个需求的，通过灵活地使用各种指令，你可以自己实现可用于响应式设计的，可添加各种伪类的类。

tailwind 中的指令都以 `@` 开头，应用于 CSS 中，在这里我举一个如何添加基础样式的例子——

- 如果你想直接在 HTML 中使用各种类，你只需要将类名与 `html` 和 `body` 元素绑定：

  ```html
  <!doctype html>
  <html lang="en" class="text-gray-900 leading-tight">
    <!-- ... -->
    <body class="min-h-screen bg-gray-100">
      <!-- ... -->
    </body>
  </html>
  ```

- 不过上面的方法显然不是平常会用到的方法。更常用的方法是在你的**全局 CSS** 中应用，这样你可以做很多好玩的事情，比如设置全局样式、配置多主题、导入自定义字体，等等：

  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
            
  @layer base {
    h1 {
      @apply text-2xl;
    }
    h2 {
      @apply text-xl;
    }
  }
  ```

  上面这个 CSS 文件中，就使用了两种指令，`@tailwind` 指令用于 tailwind 初始化，`@layer` 决定了你写的样式会被注入哪一层。

下面正式开始对指令的介绍吧，我将以各种指令的作用而不是指令名作为子标题——

#### 3.1. 初始化

我将 `@tailwind` 这个指令称为初始化相关的指令，因为你需要将该指令写在你的 CSS 文件之前，这样所有的类才会生效（不过不用每份 CSS 文件都写一遍，只要在全局 CSS 中添加即可）。

- `@tailwind base` 该指令会将 tailwind 的基本样式和你使用插件注册的基本样式注入 CSS 中。tailwind 是包含一些基本样式的，不过基本都是对默认样式的剔除。比如 tailwind 就剔除了 li 元素之前的点，还有 h1 ~ h6 标签也全部被重置为了默认文本样式。这样做的目的是为了让你意识到，一切的样式都会是你自己添加上去的。

- `@tailwind components` 该指令会将 tailwind 的组件类名和你使用插件注册的组件类名注入 CSS 中。稍后我会讲到，如何结合 `@variants` 指令和 `@apply` 指令封装组件。

- `@tailwind utilities` 该指令会将 tailwind 的 utilities 类名和你使用插件注册的 utilities 类名注入 CSS 中。

- `@tailwind screens` 该指令存在于 CSS 文件中的位置决定了 tailwind 何时为每个 utility 添加响应式变化。前面的三个指令是**不能省略**的，如果省略会导致样式丢失，但是 screens 指令是可以省略的，如果省略，tailwind 默认会将该指令添加到你所写的 CSS 的最最后。

看到这里你可能还对这几种层级具体的含义不甚了解，我会在讲到 `@layer` 这个指令时详细说明，还会讲到 tailwind 最核心的设计哲学——`utility-first` 到底是什么意思。

#### 3.2. 应用 utilities

`@apply` 指令的作用，就是可以让你在 CSS 中使用 tailwind 提供的 utilities。这个指令在你想提取类的时候非常有用。

```CSS
.btn {  
  @apply bg-gray-deep text-white border border-gray-deep;  
}
```

有一点需要注意的是，最终的 CSS 属性不是 `@apply` 后各 utilities 排列的顺序，而是它们原始存在于 tailwindcss 包内的顺序，比如你这样应用：

```CSS
.btn {
  @apply py-2 p-4;
}
```

这段代码本意是使用后设置的“四周 1rem 的 padding”覆盖先设置的“纵向 0.5rem padding”，但这样其实不会生效，因为在源 CSS 中，`py` 的设置在 `p` 之后，所以这段代码实际的效果会是“纵向 0.5rem padding”覆盖了“四周 1rem 的 padding”（注意，此时横向的 padding 不会被复写，因为 `py-2` 没有设置横向的 padding）。同样的情况也出现在行内设置 utilities 时，所以如果你想为一个组件设置一些默认值，然后 props 再传进来一个 className 属性，将这个属性拼接在行内 utilities 最后，希望可以通过外部样式覆盖默认样式，那你就要当心了，这些默认值不一定会被覆盖。

要想更精确地控制，可以使用多个 apply 指令——

```css
.btn {
  @apply py-2;
  @apply p-4;
}
```

apply 指令还可以和原生 CSS 混写：

```css
.btn {
  transform: translateY(-1px);
  @apply bg-black;
}
```

apply 指令可以应用自定义的类：

```css
.foo {
  color: blue;
}

.bar {
  @apply foo;
}
```

在使用 apply 指令应用别的类时，被引用的类所添加的 `!important` 会被剔除，要想让 `!important` 生效，需在引用后重新添加 `!important`：

```css
.foo {
  color: blue !important;
}

.bar {
  @apply foo;
}

/* 输出 */
.bar {
  color: blue;
}

.bar2 {
 @apply foo !important;
}

/* 输出 */
.bar2 {
  color: blue !important;
}
```

#### 3.3. 应用 variants

既然 utilities 可以被应用于 CSS 中，那作为另一个同等重要的概念，variants 当然也可以。你可以生成 `responsive`、`hover`、`focus`、`active` 等等不同类型的 variant，只要你将这些类别作为 `@variants` 指令的 key——

```css
@variants focus, hover {
  .rotate-0 {
    transform: rotate(0deg);
  }
  .rotate-90 {
    transform: rotate(90deg);
  }
}
```

如果你只为一个类使用了 @apply 这个指令，它只能被应用于最普通的状态，即不能添加各种伪类及响应式前缀，即使添加了前缀也没有效果。想让一个类可以添加各种前缀，那你必须将其用对应的 @variants 指令包裹——

```html
<!--hover 的时候文字依然是黄色的，因为 .div-hover-color 未用 @variants 包裹，所以无效-->
<div class="div-color hover:div-hover-color">yellow by normal, blue by hover</div>

<style>
  .div-color {
    color: yellow;
  }
  
  .div-hover-color {
    color: blue;
  }
</style>
```

```html
<!--hover 的时候文字变色-->
<div class="div-color hover:div-hover-color">yellow by normal, blue by hover</div>

<style>
  .div-color {
    color: yellow;
  }
  
  @variants hover {
    .div-hover-color {
      color: blue;
    }
  }
</style>
```

为自定义类添加响应式效果也是同理，你只有将类用 `@variants responsive` 指令包裹，才可以对这个类使用诸如 `md`、`lg`、`xl` 等响应式前缀。

#### 3.4. 指定所写类位置

前面讲到，`@tailwind` 指令会将 tailwind 的几部分依次进行初始化，而 `@layer` 指令可以根据后面所跟的 key 来决定将你写的类注入到哪部分中。这个 key 可以是 `base`，`components`，`utilities` 三者之一，而没有包括 `screens`：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  h1 {
    @apply text-2xl;
  }
  h2 {
    @apply text-xl;
  }
}

@layer components {
  .btn-blue {
    @apply bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded;
  }
}

@layer utilities {
  .filter-none {
    filter: none;
  }
  .filter-grayscale {
    filter: grayscale(100%);
  }
}
```

看到上面的示例，`@layer base` 还比较好理解，在这里应该写的是原生的 html 标签，这些自定义样式最终会被注入 `base` 这一层，如果你想调整原生 html 标签样式，为了避免出现奇奇怪怪的问题，你应该将你的 CSS 代码用 `@layer base` 指令包裹。

但是 `components` 层和 `utilities` 层之间的区别就比较模糊了，二者看起来都是自定义了一个类，那这二者之间到底有什么区别呢？

##### 3.4.1. tailwind 的核心设计哲学—— utility-first

这个概念我前面也提到了几次，但我只讲了什么是 `utility`，却一直对 `first` 避而不谈，现在我就来讲讲这个概念的具体含义。

==当你设计样式时，应该在最初只使用 utility，避免过早的抽象，这就是 utility-first 工作流。==

翻译成白话文，尽量写原子类，尽量不要封装 CSS 类。

可能大家都听说过一个被应用在了各行各业的原则，叫 `奥卡姆剃刀原则`，这个原则的内容是——

**如非必要，勿增实体。**

奥卡姆剃刀原则只是一种观点，而不是一个真理，但这正是我写代码时所遵从的原则。当我看到 tailwind 的 `utility-first` 的工作流时，第一时间就想到了奥卡姆剃刀原则，这也是我如此喜爱 tailwind 的主要原因之一——它的设计哲学很合我胃口。

有一个不记得是哪位的计算机界巨佬说过一句话，大概意思是——

> 一个系统有多适应现在的场景，它就有多不适应新的场景。

这句话道出了不要过早进行抽象的原因。

你第一次遇到一个需求，然后你通过一段逻辑解决了它，如果你没写出什么 bug，那这段逻辑想必是完美适配当前场景的。然后你想可能以后会遇到同样的场景，于是你将这段逻辑抽离为了公共的函数。但是，现实往往没有这么简单，你更可能遇到的不是同样的场景，而是相似的场景。于是你为了这个公共函数可以更好地适配更多的场景，只能给它加各种参数各种条件。慢慢地参数越来越多，if 判断越来越多，函数体也越来越长……此时这个函数其实已经很凌乱了。组件也是同理。

我认为更好的方式，是只有当你真的遇到需要复用的情况时，再对模块进行抽象。这种需要复用的情况并不一定是完整逻辑的复用，更可能其中一部分子逻辑可以复用，那就先将子逻辑抽离。其实在现实场景中，越是底层的、解决问题单一的子逻辑，被复用的可能性越大；而复杂的“大”逻辑，更可能只是遇到相似场景，如果你过早抽象了这样的“大”逻辑，那就为系统引入了更多的条件判断，也为未来埋下了雷，一旦需求变更，这样的大模块改起来是很令人头疼的，而小逻辑改起来就轻松很多。

注意，这样做并不代表违反了 DRY 原则（don't repeat yourself），避免过早抽象不代表不抽象，而是只在必要的时候抽象。

如果你想使用 tailwind，那你应该接受它的 `utility-first` 的哲学，尽量使用它提供的 utilities 直接在行内设计样式，不要滥用 @apply。如果你编写样式时还是新建一个类，然后在类里面 @apply 使用 utilities，这样其实是反模式的，有些多此一举了。

##### 3.4.2. 提取组件

提取组件对于现代前端程序员来说是常规操作，这里也不过多探讨。只是有的情况下，提取一个组件似乎显得过重了一些，比如对于一个没有嵌套层级的组件，像 button 和 input，其实没必要封装成组件，反正封装以后也就一个单标签加点样式。但你又不得不复用他们，因此你需要一个统一的样式。

对于这种情况，将样式提取为一个 CSS 类就显得轻巧了不少，在这时，你应该使用 `@layer components` 指令，表示这是一个组件级的封装——

```html
<button class="btn-blue">
  Click me
</button>
```

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn-blue {
    @apply py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75;
  }
}
```

##### 3.4.3. 添加新的 utilities

tailwind 默认已经提供了数以千计的 utilities，但可能有的时候还是不够用，比如一个非常常用的 CSS 属性组合：

```CSS
.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}
```

flex 布局对于懒人程序员来说，似乎是救命的东西，一切垂直水平靠左、居中、靠右的问题都无需再做考虑，直接 flex 一把梭。上面这个组合可以让一个元素的内部元素在垂直与水平两个方向都居中，很常见的需求。

tailwind 默认提供的 utilities 是没有这个组合的，这时你就可以封装一个 utilities。在这时，你应该使用 `@layer utilities` 指令，表示这是一个 utility 级的封装——

```CSS
@layer utilities {
  .flex-center {
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
```

这样你就可以对想要其内部元素垂直水平居中的元素直接使用 `flex-center` 这个 utility 了，就像使用默认 utilities 一样。如果你想让这个自定义 utility 可以拥有各种伪类和响应式前缀，相信你也知道该怎么做。

另外，因为这里是自定义了一个原子类，所以最好还是用 CSS 原生属性比较好，虽然使用 @apply 引用已有原子类也不会报错。

到这时你应该清楚 `@layer components` 和 `@layer utilities` 的区别了，一个是为组件而写的样式，一个是更底层的自定义原子类。

#### 3.5. 响应式布局

`@responsive` 指令其实就是 `@variants responsive` 的语法糖，让 class 支持响应式布局的需求太常见了，以至于 tailwind 将其抽离成了一个独立的指令。`@responsive` 指令的用法也很简单，不管你写什么，在外层包一个 @responsive 就可以了，其内部的 class 都会支持响应式布局——

```CSS
@layer components {  
  @responsive {  
    .btn {  
      @apply bg-gray-700 text-white;  
    }
  
    @variants hover {
	  .btn-hover {
	    @apply bg-white text-gray-700;
	  }
    }
  }
}
```

**注意**：虽然经过测试，@responsive、@layer、@variants 这几种指令的嵌套顺序怎么写都能正常响应，但是从语义上理解，@layer 放在最外层比较合适。

#### 3.6. 媒体查询

`@screen` 可以通过使用你设置的断点名称来写媒体查询，而不用像传统 CSS 一样通过值来写——

```CSS
/* 使用 @screen */
@screen sm {
  /* ... */
}

/* 等效的传统媒体查询 */
@media (min-width: 640px) {
  /* ... */
}
```

@screen 似乎和 @responsive 有点类似，都是用来写响应式布局的，但是 @screen 在全局 CSS 中设置媒体查询时特别有用，@responsive 更适合用来对个别的 components 或 utilities 添加响应式支持。

## 三、个性化定制

tailwind 不仅提供了丰富的开箱即用的功能，还充分考虑到了定制化需求，在 `tailwind.config.js` 文件中，你可以对任何特性进行定制。配置文件的所有部分都是可选的，你只需要配置需要修改的内容，tailwind 将对没有配置的内容进行默认配置。

接下来我会介绍一些常用的定制化配置项，更多的配置项这里不再赘述，大部分是一些在现有系统中引入 tailwind 时有用的配置，或是一些提高兼容性的配置，如果你想详细了解，可以去 [tailwind 官网](https://tailwindcss.com/docs/configuration) 查看。

### 3.1. theme

在 `theme` 配置项中，你可以定制颜色、字体、刻度值、断点等等任何与网站视觉设计有关的属性——

```js
// tailwind.config.js
module.exports = {
  theme: {
    colors: {
      gray: colors.coolGray,
      blue: colors.lightBlue,
      red: colors.rose,
      pink: colors.fuchsia,
    },
    fontFamily: {
      sans: ['Graphik', 'sans-serif'],
      serif: ['Merriweather', 'serif'],
    },
    extend: {
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      }
    }
  }
}
```

在 theme 中，除了各个属性有单独的配置项，还有一个 `extend` 属性，在各属性的配置项中，可以调整 tailwind 已有的值，而在 extend 中，可以扩展 tailwind 没有的值。比如 tailwind 中的 spacing 默认只到 96，你可以在 theme.extend.spacing 中将其继续扩展。

theme 比较常用到的几个属性：

- colors。有了 colors 属性，就可以为项目添加主题色了，比如——

  ```js
  module.exports = {
    theme: {
	  extend: {
	    colors: {
		  'gray-light': '#f2f2f2',
		  'gray-normal': '#859395',
		  'gray-deep': '#455255',
		}
	  }
	}
  }
  ```

  只要在这里配置了颜色，一切可以设置颜色的 utilities 就可应用这个颜色了，比如 `bg-gray-light` 会将背景色变成 `#f2f2f2`，`text-gray-normal` 会将文本变成 `#859395`，而在 CSS 文件中也可以通过 @apply 应用色彩，无需单独设置颜色。

- spacing。有了 spacing，你无需为每个带有刻度后缀的属性单独设置刻度，可以在这里统一设置，然后这个刻度会应用到所有带有刻度值的属性上——

  ```js
  module.exports = {
    theme: {
	  extend: {
	    spacing: {
		  '1px': '1px',  
          '2px': '2px',
		  '2/3-vh': '66.7vh',
		  '-120': '-30rem',
		  '2full': '200%',
		}
	  }
	}
  }
  ```

  接下来你就可以使用 `w-2/3-vh`、`-top-120`、`translate-x-2full` 这样的属性了！

- fontFamily。有的网站有字体方面的要求，fontFamily 配合 @font-face 可以很好地完成需求。比如对于一个购物网站，可能每个英文品牌名需要用 `sangbleu kingdom` 这个炫酷的英文字体，中文的品牌名需要用 `思源黑体`；每个标题需要用 `思源宋体`；而对于默认的文本，英文要使用 `BrownStd` 字体，中文则使用 `思源黑体`小字部分字体和普通文本相同，但是除了 `font-size` 比普通文本小以外，`font-weight` 也应该更细。面对这样的需求，你可以这样写——

  ```css
  /* 首先在全局 CSS 中指定 font-face，并对需要调细的字体添加 font-weight */
  @layer base {
    @font-face {
	  font-family: 'BrownStd';
	  src: url('/BrownStd-Normal.ttf');
	  font-weight: 400;
	}
	@font-face {
	  font-family: 'BrownStd';
	  src: url('/BrownStd-Light.ttf');
	  font-weight: 300;
	}
	@font-face {
	  font-family: 'SiYuanHeiTi';
	  src: url('/SiYuanHeiTi-Normal.ttf');
	  font-weight: 400;
	}
	@font-face {
	  font-family: 'SiYuanHeiTi';
	  src: url('/SiYuanHeiTi-Light.ttf');
	  font-weight: 300;
	}
	@font-face {
	  font-family: 'SiYuanSong';  
      src: url('/SiYuanSong.ttf');
	}
	@font-face {
	  font-family: 'sangbleu kingdom';
	  src: url('/SangbleuKingdom.ttf');
	}
  }
  ```

  ```js
  // 在 tailwind.config.js 中配置字体族
  module.exports = {
    theme: {
	  extend: {
	    fontFamily: {
		  // 先设置英文字体，中文不匹配英文字体，就会使用第二个设置的思源黑体
		  brand: ['sangbleu kingdom', 'SiYuanHeiTi'],
		  title: ['SiYuanSong'],
		  content: ['BrownStd', 'SiYuanHeiti']
		}
	  }
	}
  }
  ```

  ```html
  <!-- 比如这里有个商品卡片组件，可以对品牌名称、商品标题、商品描述及价格分别应用这三个字体族 -->
  <div class="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
    <div class="md:flex">
      <div class="md:flex-shrink-0">
        <img class="h-48 w-full object-cover md:w-48" src="example.com/example.jpg" alt="商品图片">
      </div>
      <div class="p-8">
	    <!-- 这里对品牌名设置了 font-brand 字体 -->
        <div class="uppercase tracking-wide text-sm text-indigo-500 font-brand">Armani 阿玛尼</div>
		<!-- 这里对标题设置了 font-title 字体 -->
        <h3 class="block mt-1 text-lg leading-tight font-title text-black">Armani 当季新款大衣</h3>
		<!-- 商品描述和价格都使用 font-content 字体，但是价格添加 font-light 属性 -->
        <p class="mt-2 text-gray-500 font-content">走过路过不要错过</p>
		<!-- tailwind 中 font-light 默认为 font-weight: 300，
		所以会匹配 font-face 中设置了 font-weight 为 300 的 light 字体，
		如果 font-face 中不设置 font-weight 属性，则 font-light 这个 utility 是无效的 -->
	    <span class="text-sm font-content font-light">原价：39999 现价：998</span>
      </div>
    </div>
  </div>
  ```

- transitionProperty。如果你想为你的网站添加动画，transition 是必不可少的。tailwind 默认支持应用 transition 的属性不多，只有七个，像非常常用的 `height` 属性就不支持，所以你需要在配置文件中设置——

  ```js
  module.exports = {
    theme: {
	  extend: {
	    transitionProperty: {
		  height: 'height',
		  top: 'top',
		  bottom: 'bottom',
		  ...
		}
	  }
	}
  }
  ```

- keyframes & animation。你可以直接在 tailwind.config.js 中配置关键帧以及动画——

  ```js
  module.exports = {
    theme: {
	  extend: {
	    keyframes: {
		  marquee: {  
            '0%': {  
              transform: 'translate3d(0, 0, 0)',  
            },  
            '100%': {  
              transform: 'translate3d(-9000px, 0, 0)',  
            },  
          },
		},
		animation: {
		  marquee: '500s linear 0s infinite normal none running marquee',
		}
	  }
	}
  }
  ```

### 3.2. variants

tailwind 默认并不是每个属性都开启了各个 variants 的，所以如果你想为某个属性应用某种状态，最好先检查一下这个属性是否支持这个状态，如果不支持的话，就需要在配置文件的 `variants` 属性中为该属性开启对应的状态。

在该属性中，每个属性开启的 variants 以数组形式添加。

比如 `margin` 这个属性，默认只支持响应式 variant，所以如果你想为其添加 `first:` 这样的前缀来只让第一个子元素有 margin 效果，需要这样写——

```js
module.exports = {
  variants: {
    extend: {
      margin: ['first'],
  }
}
```

### 3.3. purge

这个属性用于打包优化。由于囊括了数以千计的 utilities，如果你不为 tailwind 进行生产环境的打包优化，那它的体积会非常恐怖——

![不对生产环境进行优化，体积是非常大的](/posts/tailwindcss-exploration-2.jpg)

这就是我踩过的一次坑，由于没有打包优化，网站的 app.js 体积达到了 2.2M，点进去一看，tailwind 这行有六百多万个字符！

前文有提到过，tailwind 最终会扫描你的源码进行 `tree-shake`，去除没有用到过的 utilities，要实现这点，就需要你在配置文件的 `purge` 属性中指定你想让 tailwind 扫描的路径——

```js
module.exports = {
  purge: [
    './src/**/*.html',
    './src/**/*.vue',
    './src/**/*.jsx',
    './src/**/*.tsx',
  ],
}
```

除此以外，你还需要确定在你需要让 tailwind 进行 tree-shake 的环境添加环境变量 `NODE_ENV=production`，只有 NODE_ENV 值为 `production`，tailwind 才会进行清除工作。

到此为止，关于 tailwindcss 这个 CSS 框架，比较常用的特性就基本介绍完毕了，这是相当长的一篇文章，非常感谢你能看到这里。当然，这些并不是全部，还有一些高级特性，比如插件，我就没有讲到，感兴趣的同学可以去 [tailwind 官网](https://tailwindcss.com/docs/plugins) 自行了解。

每个从指定 classname 写 CSS 类过来的人，第一次见到 tailwind 多少都会有点看不起这样的框架这样的写法。但是也许你真的应该去尝试一下，只有当你亲自上手体验过，你才能意识到这是一个多么高效的框架，用它来写 CSS 是多么爽的一件事，这是一个只要用了就回不去的框架。

如果你对 tailwind 提供的种种 utilities 还不熟悉，你只需要点开 [tailwind 文档](https://tailwindcss.com/docs)，在上方搜索框搜索原生的 CSS 属性名，就会为你展示对应的 utilities 名，每个 utility 属性都有自己的详情介绍，你可以在那里了解其用法以及如何自定义等等。

## 结束语

一个规范的、稍微成规模的项目，是一定会有可复用的组件的。对于从接触前端就开始使用三大框架的年轻程序员来说，遇到这样的情况封装一个组件或是一个模板似乎是理所当然的事情，但是当我们回顾历史，想一想这种需求在原始的 HTML 中应该如何实现呢？似乎只能封装一些表达样式的 CSS 类，然后绑定到一段 HTML 结构中，再到处复制这段 HTML。

```html
<style>
  .vacation-card { /* ... */ }
  .vacation-card-info { /* ... */ }
  .vacation-card-eyebrow { /* ... */ }
  .vacation-card-title { /* ... */ }
  .vacation-card-price { /* ... */ }
</style>

<!-- Even with custom CSS, you still need to duplicate this HTML structure -->
<div class="vacation-card">
  <img class="vacation-card-image" src="..." alt="Beach in Cancun">
  <div class="vacation-card-info">
    <div>
      <div class="vacation-card-eyebrow">Private Villa</div>
      <div class="vacation-card-title">
        <a href="/vacations/cancun">Relaxing All-Inclusive Resort in Cancun</a>
      </div>
      <div class="vacation-card-price">$299 USD per night</div>
    </div>
  </div>
</div>
```

时间回到现在，模块化的思想已经深入人心，这时继续延续从历史继承下来的封装 CSS 类的写法，是否显得多此一举了呢？可能不同的人对这个问题会有不同的答案，但我的答案是肯定的。

JS 和 HTML 现在已经是模块化的了，而近些年来也有很多大牛为了让 CSS 也可以模块化而做出了很多尝试——像 vue 的模板语法，less、sass 等预处理器，css-in-js 库，这些都是为了避免 CSS 的全局污染，以及为了更方便地对 CSS 进行复用而做进行的探索。

而 tailwindcss 则更进一步，它甚至让你几乎不再需要 CSS 就可以设计样式，之前的那些语法在它面前似乎都显得啰嗦了一些。可能有人吐槽 tailwind 像在写 inline-style，前端的技术兜兜转转一圈又回去了，等等。还是那句话——`如非必要，勿增实体`，今时不同往日，如果类 inline-style 的写法已经可以很好的完成工作，为什么要多此一举地封装 CSS 呢？想一想当初封装 CSS 类的目的是什么，在这些目的中，又有哪些是如今的 tailwind 实现不了的呢？

此外，tailwind 也让 CSS 的复用几乎达到了极致——一个 CSS 属性，在最终打包的源码里，至多只存在一份。除了代码可读性的一点点降低，它似乎不再有什么缺点。

在我看来，像 tailwind 这样的框架，也许是 CSS 的未来。
