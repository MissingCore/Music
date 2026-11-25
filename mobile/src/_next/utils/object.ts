// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

/** Split an array into "chunks". */
export function chunkArray<T>(arr: T[], chunkSize: number) {
  const chunkedArray: T[][] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunkedArray.push(arr.slice(i, i + chunkSize));
  }
  return chunkedArray;
}
