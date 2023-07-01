export default class Queue<AnchorFn extends (...args: any[]) => void> {
  queue: (() => void)[];
  timerId: null | number;
  speed: number;
  isRunning: boolean;
  constructor(speed?: number) {
    this.queue = [];
    this.timerId = null;
    this.speed = speed ?? 2000;
    this.isRunning = false;
  }

  addQueue = <Args extends any[]>(fn: AnchorFn, ...args: Args) => {
    this.queue.push(() => fn(...args));
    if (!this.isRunning) {
      this.start();
    }
  };

  start = () => {
    this.isRunning = true;
    if (!this.timerId && this.queue.length > 0) {
      this.queue.shift()!();
    }
    this.timerId = window.setInterval(() => {
      if (this.queue.length > 0) {
        this.queue.shift()!();
      } else {
        this.stop();
      }
    }, this.speed);
  };

  stop = () => {
    this.timerId && window.clearInterval(this.timerId);
    this.timerId = null;
    this.isRunning = false;
  };

  reset = () => {
    this.stop();
    this.queue = [];
  };
}
