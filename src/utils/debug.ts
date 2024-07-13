/**
 * @description Return time in seconds since last `performance.now()`
 *  call in a formatted string.
 */
export function splitTime(start: number) {
  return `${((performance.now() - start) / 1000).toFixed(4)}s`;
}
