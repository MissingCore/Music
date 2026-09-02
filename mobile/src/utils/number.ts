// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

/** Convert bit rate to kbit/s. */
export function abbreviateBitRate(rate: number) {
  return `${(rate / 1000).toFixed(2).replace(".00", "")} kbit/s`;
}

/** Abbreviate size in bytes. */
export function abbreviateSize(size: number) {
  if (size >= 1e9) {
    return `${(size / 1e9).toFixed(2)} GB`;
  } else if (size >= 1e6) {
    return `${(size / 1e6).toFixed(2)} MB`;
  } else if (size >= 1e3) {
    return `${(size / 1e3).toFixed(2)} KB`;
  } else {
    return `${size} B`;
  }
}

/** Clamp value between 2 other values. */
export function clamp(min: number, value: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** Count the number of positions after the decimal in a number. */
export function countDecimals(value: number) {
  const asString = value.toString();
  if (!asString.includes(".")) return 0;
  return asString.split(".").at(-1)!.length;
}
