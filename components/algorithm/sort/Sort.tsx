import React from 'react';
import Queue from '../queue';
import RowLayout from '../../RowLayout';

const l = [1, 5, 7, 4, 2, 6, 3];

const queue = new Queue();

const swap = (array: number[], currIndex: number, nextIndex: number) => {
  const temp = array[currIndex];
  array[currIndex] = array[nextIndex];
  array[nextIndex] = temp;
  return array;
};

interface P {
  x: number;
  y: number;
}
// 定义一个三次贝塞尔曲线函数
const cubicBezier = (p1: P, p2: P, t: number) => {
  const p0 = { x: 0, y: 0 };

  const oneMinusT = 1 - t;
  const oneMinusTSquared = oneMinusT * oneMinusT;
  const tSquared = t * t;

  // y
  return oneMinusTSquared * p0.y + 2 * oneMinusT * t * p1.y + tSquared * p2.y;
};

// 定义一个函数，将线性进度转换为渐入渐出的曲线
const easeInOut = (progress: number) => {
  // 为 easeInOut 曲线定义贝塞尔控制点
  const p1 = { x: 0.42, y: 0 };
  const p2 = { x: 0.58, y: 1 };

  // 将线性进度映射到贝塞尔曲线
  return cubicBezier(p1, p2, progress);
};

export default function Sort() {
  const [renderChartCtx, setRenderChartCtx] = React.useState<{
    frontItem: number | null;
    frontItemIndex: number;
    prevFrontItemIndex: number;
    backItem: number | null;
    backItemIndex: number;
    prevBackItemIndex: number;
    endPosition: number;
  }>({
    frontItem: null,
    frontItemIndex: -1,
    prevFrontItemIndex: -1,
    backItem: null,
    backItemIndex: -1,
    prevBackItemIndex: -1,
    endPosition: l.length,
  });
  const [list, setList] = React.useState(l);
  const [isRunning, setIsRunning] = React.useState(false);
  const [hasRunSort, setHasRunSort] = React.useState(false);
  const [isStepForward, setIsStepForward] = React.useState<boolean>();
  const canvasRef = React.useRef<HTMLCanvasElement>();

  const sort = (autoStartQueue = true) => {
    const array = list.concat([]);
    for (let i = 0; i < array.length; i++) {
      for (let j = 0; j < array.length - i - 1; j++) {
        const frontItemIndex = j;
        const frontItem = array[frontItemIndex];
        const backItemIndex = j + 1;
        const backItem = array[backItemIndex];
        const currentList = [...array];
        queue.addQueue(() => {
          setList(currentList);
          setRenderChartCtx((prev) => ({
            frontItem,
            frontItemIndex,
            prevFrontItemIndex: prev.frontItemIndex,
            backItem,
            backItemIndex,
            prevBackItemIndex: prev.backItemIndex,
            endPosition: array.length - i,
          }));
        }, autoStartQueue);
        if (array[j] > array[j + 1]) {
          const newList = [...swap(array, j, j + 1)];
          queue.addQueue(() => {
            setList(newList);
            setRenderChartCtx((prev) => ({
              ...prev,
              frontItemIndex: backItemIndex,
              prevFrontItemIndex: prev.frontItemIndex,
              backItemIndex: frontItemIndex,
              prevBackItemIndex: prev.backItemIndex,
            }));
          }, autoStartQueue);
        }
      }
    }

    setHasRunSort(true);
  };

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const barWidth = 20;
    const barSpacing = 8;

    const max = Math.max(...list);
    canvas.height = 300;
    canvas.width = 400;

    // 为正在做比较的两个元素添加着色时的透明度动画
    let alpha = 0;
    // 为正在做比较的两个元素添加位移动画
    let offset = 0;
    // requestAnimationFrame id
    let animateId: number;
    const drawBars = () => {
      const totalOffset = barWidth + barSpacing;
      // 透明度动画和位移动画没完成时，继续绘制
      if (alpha < 1 || offset < totalOffset) {
        alpha += 0.04;
        const newOffset = easeInOut(offset / totalOffset) * totalOffset;
        offset += newOffset === 0 ? 1 : newOffset;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        /**
         * 绘制柱形图，规则：
         * 1. 每个柱形颜色默认为 rgb(255, 127, 80)
         * 2. 正在比较的两个柱形，颜色会逐渐发生变化，前一个颜色变为 rgb(100, 149, 237)，后一个颜色变为 rgb(0, 139, 139)
         * 3. 正在比较的两个柱形，如果需要交换位置，在交换的过程中会有位移的动画
         * 4. 已经排序完成的柱形，颜色会渐变为 rgb(205, 92, 92)
         */
        list.forEach((value, index) => {
          /**
           * 互换位置的动画：
           * 在互换时，frontItem 会向后移动 totalOffset，backItem 会向前移动 totalOffset
           * 当判断两个元素需要互换时，frontItem 的初始 x 为 最终 x - totalOffset，backItem 的初始 x 为 最终 x + totalOffset
           *
           */
          const finalX = index * totalOffset;
          const calcX = () => {
            const isSwapping = isStepForward
              ? renderChartCtx.frontItemIndex > renderChartCtx.backItemIndex
              : renderChartCtx.prevFrontItemIndex > renderChartCtx.prevBackItemIndex;
            if (
              !isSwapping || // 当前不是交换位置的动画
              (index !== renderChartCtx.frontItemIndex && index !== renderChartCtx.backItemIndex) || // 当前柱形不是正在交换位置的两个柱形
              offset >= totalOffset // 交换位置的动画已经完成
            ) {
              return finalX;
            }
            if (isStepForward) {
              if (index === renderChartCtx.frontItemIndex) {
                return finalX - totalOffset + offset;
              }
              return finalX + totalOffset - offset;
            } else {
              if (index === renderChartCtx.frontItemIndex) {
                return finalX + totalOffset - offset;
              }
              return finalX - totalOffset + offset;
            }
          };
          const x = calcX();
          const height = (300 / max) * value - 20;
          const y = canvas.height - height;

          // 先绘制默认颜色的柱形，避免在动画过程中出现空白
          ctx.fillStyle = 'rgba(255, 127, 80, 1)';
          ctx.fillRect(x, y, barWidth, height);

          // 绘制正在比较的两个柱形和已经排序完成的柱形
          if (
            index === renderChartCtx.frontItemIndex ||
            index === renderChartCtx.backItemIndex ||
            index >= renderChartCtx.endPosition
          ) {
            const calcColor = () => {
              const isSwapping = isStepForward
                ? renderChartCtx.frontItemIndex > renderChartCtx.backItemIndex
                : renderChartCtx.prevFrontItemIndex > renderChartCtx.prevBackItemIndex;
              if (index === renderChartCtx.frontItemIndex) {
                /**
                 * frontItem, backItem
                 *        👇
                 * backItem, frontItem
                 *        👇
                 *           frontItem, backItem
                 * 如上方示例，上一次排序换位之后，原来的 backItem 与 frontItem 互换，此时触发一次绘制
                 * 然后排序算法下一次遍历，frontItem 不变，backItem 换到了再下一位，此时触发一次绘制，此时的绘制，
                 * 应该只让新的 backItem 有颜色渐变，而 frontItem 颜色不需要渐变，以体现出 frontItem 未发生变化
                 */
                return `rgba(100, 149, 237, ${
                  isSwapping || renderChartCtx.prevFrontItemIndex === renderChartCtx.frontItemIndex
                    ? '1'
                    : alpha
                })`;
              }
              if (index === renderChartCtx.backItemIndex) {
                return `rgba(0, 139, 139, ${isSwapping ? '1' : alpha})`;
              }
              // 已经排序完成的柱形，第一次绘制时有渐变效果，后续绘制时不再有渐变效果
              return `rgba(205, 92, 92, ${index === renderChartCtx.endPosition - 1 ? alpha : '1'})`;
            };
            ctx.fillStyle = calcColor();

            ctx.fillRect(x, y, barWidth, height);
          }

          // 在柱形上方显示数值文本信息
          ctx.fillStyle = 'black';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(value.toString(), x + barWidth / 2, y - 5);
        });

        animateId = requestAnimationFrame(drawBars);
      } else {
        alpha = 0;
        offset = 0;
        cancelAnimationFrame(animateId);
      }
    };

    animateId = requestAnimationFrame(drawBars);
  }, [
    list,
    isStepForward,
    renderChartCtx.endPosition,
    renderChartCtx.frontItem,
    renderChartCtx.backItem,
    renderChartCtx.frontItemIndex,
    renderChartCtx.prevFrontItemIndex,
    renderChartCtx.backItemIndex,
    renderChartCtx.prevBackItemIndex,
  ]);

  return (
    <div className="App">
      <RowLayout>
        <button
          onClick={() => {
            isRunning ? queue.stop() : sort();
            setIsRunning(!isRunning);
            setIsStepForward(true);
          }}
        >
          {isRunning ? '暂停' : '开始'}
        </button>
        <button
          onClick={() => {
            !hasRunSort && sort(false);
            setIsStepForward(true);
            queue.executeTask();
          }}
        >
          下一步
        </button>
        <button
          onClick={() => {
            setIsStepForward(false);
            queue.rollbackTask();
          }}
        >
          上一步
        </button>
        <button
          onClick={() => {
            setList(l);
            setRenderChartCtx({
              frontItem: null,
              frontItemIndex: -1,
              prevFrontItemIndex: -1,
              backItem: null,
              backItemIndex: -1,
              prevBackItemIndex: -1,
              endPosition: l.length,
            });
            queue.reset();
          }}
        >
          重置
        </button>
      </RowLayout>
      <canvas ref={canvasRef as any} id="canvas" className="bg-white p-4" />
    </div>
  );
}
