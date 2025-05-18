/** Typeguard for finding promises that were fulfilled in `Promise.allsettled()`. */
export const isFulfilled = <T>(
  input: PromiseSettledResult<T>,
): input is PromiseFulfilledResult<T> => input.status === "fulfilled";

/** Typeguard for finding promises that were rejected in `Promise.allsettled()`. */
export const isRejected = (
  input: PromiseSettledResult<unknown>,
): input is PromiseRejectedResult => input.status === "rejected";

/** Presets for the amount of concurrent tasks we want. */
export const BATCH_PRESETS = {
  // Below are presets based on the type of workload.
  LIGHT: 500,
  MODERATE: 200,
  HEAVY: 100,
  // Below are presets for showing progress to users.
  PROGRESS: 25,
  LIVE: 1,
} as const;

/**
 * Run promises in batches to prevent overloading.
 *
 * Running a lot of promises inside a `Promise.allSettled()` may be faster,
 * but may crash on devices with less memory.
 */
export async function batch<TData, TResult>({
  data,
  batchAmount = BATCH_PRESETS.MODERATE,
  callback,
  onBatchComplete,
}: {
  data: TData[];
  /**
   * Number of entries we want to run `callback` on concurrently. Defaults
   * to `BATCH_PRESETS.MODERATE`.
   */
  batchAmount?: number;
  /** Function that's called on each `data` entry. */
  callback: (data: TData) => TResult | Promise<TResult>;
  /**
   * Runs after each batch of `batchAmount` is completed. Returns the
   * results of `Promise.allSettled()`.
   */
  onBatchComplete?: (
    fulfilled: TResult[],
    rejected: any[],
  ) => Promise<void> | void;
}) {
  for (let i = 0; i < data.length; i += batchAmount) {
    const res = await Promise.allSettled(
      data
        .slice(i, i + batchAmount)
        .filter((i) => i !== undefined)
        .map(callback),
    );
    if (onBatchComplete) {
      await onBatchComplete(
        res.filter(isFulfilled).map(({ value }) => value),
        res.filter(isRejected).map(({ reason }) => reason),
      );
    }
  }
}

/**
 * Asynchronously pause logic for the specified amount of time. Useful to
 * prevent code blocking due to an async task.
 */
export async function wait(durationMs: number) {
  await new Promise<void>((resolve) => setTimeout(resolve, durationMs));
}
