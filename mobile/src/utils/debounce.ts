/**
 * Debounces a function. Calls the function with an array of all the
 * items that called it.
 *
 * **Note:** Only works with functions with a single argument.
 */
export function debounceWithAccumulation<T>(
  func: (args: T[]) => void,
  delay = 300,
) {
  let timeout: ReturnType<typeof setTimeout>;
  let accumulatedArgs: T[] = [];

  return function (arg: T) {
    accumulatedArgs.push(arg);
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(accumulatedArgs);
      accumulatedArgs = [];
    }, delay);
  };
}
