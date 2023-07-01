import React from 'react';
import Queue from '../queue';

const l = [1, 5, 7, 4, 2, 6, 3];

const queue = new Queue();

const swap = (array: number[], currIndex: number, nextIndex: number) => {
  const temp = array[currIndex];
  array[currIndex] = array[nextIndex];
  array[nextIndex] = temp;
  return array;
};

export default function Sort() {
  const [renderChartCtx, setRenderChartCtx] = React.useState({
    frontItem: l[0],
    frontItemPrevIndex: 0,
    frontItemCurrIndex: 0,
    backItem: l[1],
    endPosition: l.length,
    isSwapping: false,
  });
  const [list, setList] = React.useState(l);
  const canvasRef = React.useRef<HTMLCanvasElement>();

  const sort = () => {
    const array = list.concat([]);
    for (let i = 0; i < array.length; i++) {
      for (let j = 0; j < array.length - i - 1; j++) {
        queue.addQueue(
          (frontItem, backItem) => {
            setRenderChartCtx({
              frontItem,
              frontItemPrevIndex: j,
              frontItemCurrIndex: j,
              backItem,
              endPosition: array.length - i,
              isSwapping: false,
            });
          },
          array[j],
          array[j + 1]
        );
        if (array[j] > array[j + 1]) {
          const newList = swap(array, j, j + 1);
          queue.addQueue(
            (l) => {
              setList(l);
              setRenderChartCtx((prev) => ({
                ...prev,
                frontItemPrevIndex: j + 1,
                isSwapping: true,
              }));
            },
            [...newList]
          );
        }
      }
    }
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

    /**
     * 排序终点线的位置：
     * 终点之前有几个 bar，每个 bar 加上其后的间距，最后一个 bar 的间距只算一半
     */
    const endLinePos = renderChartCtx.endPosition * (barWidth + barSpacing) - barSpacing / 2;

    // 为正在做比较的两个元素添加着色时的透明度动画
    let alpha = 0;
    // 为正在做比较的两个元素添加位移动画
    let offset = 0;
    // requestAnimationFrame id
    let animateId: number;
    const drawBars = () => {
      // 透明度动画和位移动画没完成时，继续绘制
      if (alpha < 1 || offset < barWidth + barSpacing) {
        alpha += 0.04;
        offset += 1;
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
           * 在互换时，frontItem 会向后移动 barWidth + barSpacing，backItem 会向前移动 barWidth + barSpacing
           * 当判断两个元素需要互换时，frontItem 的初始 x 为 最终 x - barWidth - barSpacing，backItem 的初始 x 为 最终 x + barWidth + barSpacing
           *
           */
          const finalX = index * (barWidth + barSpacing);
          const calcX = () => {
            if (
              !renderChartCtx.isSwapping || // 这次绘制不是因为交换位置而触发的
              (value !== renderChartCtx.frontItem && value !== renderChartCtx.backItem) || // 当前柱形不是正在交换位置的两个柱形
              offset >= barWidth + barSpacing // 交换位置的动画已经完成
            ) {
              return finalX;
            }
            if (value === renderChartCtx.frontItem) {
              return finalX - barWidth - barSpacing + offset;
            }
            return finalX + barWidth + barSpacing - offset;
          };
          const x = calcX();
          const height = (300 / max) * value - 20;
          const y = canvas.height - height;

          // 先绘制默认颜色的柱形，避免在动画过程中出现空白
          ctx.fillStyle = 'rgba(255, 127, 80, 1)';
          ctx.fillRect(x, y, barWidth, height);

          // 绘制正在比较的两个柱形和已经排序完成的柱形
          if (
            value === renderChartCtx.frontItem ||
            value === renderChartCtx.backItem ||
            index >= renderChartCtx.endPosition
          ) {
            const calcColor = () => {
              if (value === renderChartCtx.frontItem) {
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
                  renderChartCtx.frontItemPrevIndex === renderChartCtx.frontItemCurrIndex
                    ? '1'
                    : alpha
                })`;
              }
              if (value === renderChartCtx.backItem) {
                return `rgba(0, 139, 139, ${alpha})`;
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

        ctx.moveTo(endLinePos, 20); // 设置起始点坐标
        ctx.lineTo(endLinePos, 300); // 设置结束点坐标
        ctx.strokeStyle = '#483D8B';
        ctx.stroke(); // 绘制直线

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
    renderChartCtx.endPosition,
    renderChartCtx.frontItem,
    renderChartCtx.backItem,
    renderChartCtx.frontItemPrevIndex,
    renderChartCtx.frontItemCurrIndex,
    renderChartCtx.isSwapping,
  ]);

  return (
    <div className="App">
      <button onClick={sort}>click</button>
      <button
        onClick={() => {
          setList(l);
          setRenderChartCtx({
            frontItem: l[0],
            frontItemPrevIndex: 0,
            frontItemCurrIndex: 0,
            backItem: l[1],
            endPosition: l.length,
            isSwapping: false,
          });
          queue.reset();
        }}
      >
        reset
      </button>
      <canvas ref={canvasRef as any} id="canvas" className="bg-white p-4" />
    </div>
  );
}
