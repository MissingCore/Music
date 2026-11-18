// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { BoundedMap } from "../bounded-map";

describe("BoundedMap", () => {
  test("evicts the oldest entry when the map exceeds its limit", () => {
    const map = new BoundedMap<string, number>(2);

    map.set("first", 1);
    map.set("second", 2);
    map.set("third", 3);

    expect(map.size).toBe(2);
    expect([...map]).toEqual([
      ["second", 2],
      ["third", 3],
    ]);
  });
});
