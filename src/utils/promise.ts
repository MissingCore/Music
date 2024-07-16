/** Typeguard for finding promises that were fulfilled in `Promise.allsettled()`. */
export const isFulfilled = <T>(
  input: PromiseSettledResult<T>,
): input is PromiseFulfilledResult<T> => input.status === "fulfilled";

/** Typeguard for finding promises that were rejected in `Promise.allsettled()`. */
export const isRejected = (
  input: PromiseSettledResult<unknown>,
): input is PromiseRejectedResult => input.status === "rejected";
