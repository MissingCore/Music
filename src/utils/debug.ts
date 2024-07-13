/** @description Help track performance of code. */
export class Stopwatch {
  laps: number[] = [];

  constructor(startNow = true) {
    if (startNow) this.start();
  }

  /** Push the current time. */
  #lap() {
    this.laps.push(performance.now());
  }

  /** Start stopwatch. */
  start() {
    this.#lap();
  }

  /** Return total time in seconds since start as a formatted string. */
  stop() {
    this.#lap();
    return `${((this.laps.at(-1)! - this.laps.at(0)!) / 1000).toFixed(4)}s`;
  }

  /** Return time in seconds since last lap as a formatted string. */
  lapTime() {
    this.#lap();
    return `${((this.laps.at(-1)! - this.laps.at(-2)!) / 1000).toFixed(4)}s`;
  }
}
