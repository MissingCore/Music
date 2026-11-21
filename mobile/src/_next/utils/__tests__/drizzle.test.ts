// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { throwIfNoResults } from "../drizzle";

describe("throwIfNoResults", () => {
  test("returns successful query results unchanged", async () => {
    const item = { id: 1 };

    await expect(throwIfNoResults(Promise.resolve(item))).resolves.toBe(item);
    await expect(throwIfNoResults(Promise.resolve([item]))).resolves.toEqual([
      item,
    ]);
  });

  test("throws error if query returns no results", async () => {
    await expect(
      throwIfNoResults(Promise.resolve(undefined)),
    ).rejects.toThrow();
    await expect(throwIfNoResults(Promise.resolve([]))).rejects.toThrow();
  });
});
