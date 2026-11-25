// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { chunkArray } from "../object";

describe("chunkArray", () => {
  test("splits into chunks and keeps the remainder", () => {
    expect(chunkArray([0, 1, 2, 3, 4], 2)).toEqual([[0, 1], [2, 3], [4]]);
  });

  test("returns one chunk when the size exceeds the array length", () => {
    const arr = [0, 1, 2, 3, 4, 5];
    expect(chunkArray(arr, 10)).toEqual([arr]);
    expect(chunkArray([], 10)).toEqual([]);
  });

  test("accepts a chunk size of 1", () => {
    expect(chunkArray([0, 1], 1)).toEqual([[0], [1]]);
  });

  test("requires a positive integer chunk size", () => {
    expect(() => chunkArray([], 0)).toThrow();
    expect(() => chunkArray([], -1)).toThrow();
    expect(() => chunkArray([], 1.5)).toThrow();
  });
});
