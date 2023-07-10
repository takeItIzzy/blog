export default class Queue<AnchorFn extends (...args: any[]) => void> {
  // 任务队列
  queue: AnchorFn[];
  activeTask: AnchorFn | null;
  // 执行完毕的任务栈，用于回退任务
  stack: AnchorFn[];
  timerId: null | number;
  speed: number;
  isRunning: boolean;
  constructor(speed?: number) {
    this.queue = [];
    this.activeTask = null;
    this.stack = [];
    this.timerId = null;
    this.speed = speed ?? 2000;
    this.isRunning = false;

    return new Proxy(this, {
      set: (target, key, value: AnchorFn) => {
        if (key === 'activeTask' && value !== null) {
          value();
        }
        return Reflect.set(target, key, value);
      },
    });
  }

  addQueue<Args extends any[]>(fn: AnchorFn, autoStart = true) {
    this.queue.push(fn);
    if (autoStart && !this.isRunning) {
      this.start();
    }
  }

  // activeTask 中的任务存入 stack，queue 中的任务存入 activeTask，存入 activeTask 的任务会立即执行
  executeTask() {
    if (this.activeTask) {
      this.stack.push(this.activeTask);
    }
    const task = this.queue.shift();
    this.activeTask = task ?? null;
  }

  // activeTask 中的任务存入 queue，stack 中的任务存入 activeTask，存入 activeTask 的任务会立即执行
  rollbackTask() {
    if (this.activeTask) {
      this.queue.unshift(this.activeTask);
    }
    const task = this.stack.pop();
    this.activeTask = task ?? null;
  }

  start() {
    this.isRunning = true;
    if (!this.timerId && this.queue.length > 0) {
      this.executeTask();
    }
    this.timerId = window.setInterval(() => {
      if (this.queue.length > 0) {
        this.executeTask();
      } else {
        this.stop();
      }
    }, this.speed);
  }

  stop() {
    this.timerId && window.clearInterval(this.timerId);
    this.timerId = null;
    this.isRunning = false;
  }

  reset = () => {
    this.stop();
    this.queue = [];
    this.activeTask = null;
    this.stack = [];
  };
}
