// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { containSorter, lowerHas, lowerStart, matchSort } from "../search";

describe("lowerHas", () => {
  test("matches case-insensitively", () => {
    expect(lowerHas("The Beatles", "beat")).toBe(true);
  });

  test("rejects non-string values", () => {
    expect(lowerHas(undefined, "test")).toBe(false);
    expect(lowerHas(null, "test")).toBe(false);
  });
});

describe("lowerStart", () => {
  test("matches case-insensitive prefixes", () => {
    expect(lowerStart("Abbey Road", "ab")).toBe(true);
  });

  test("rejects non-string values", () => {
    expect(lowerStart(42, "4")).toBe(false);
  });
});

describe("matchSort", () => {
  test("moves matching items ahead without changing their relative order", () => {
    const items = [
      { name: "partial" },
      { name: "match first" },
      { name: "match second" },
    ];

    expect(matchSort(items, (item) => item.name.startsWith("match"))).toEqual([
      { name: "match first" },
      { name: "match second" },
      { name: "partial" },
    ]);
  });
});

describe("containSorter", () => {
  test("filters matches and prioritizes values starting with the query", () => {
    const items = [
      { name: "The Album", artist: "First Artist" },
      { name: "Live Album", artist: "Second Artist" },
      { name: "Album", artist: "Third Artist" },
    ];

    expect(containSorter(items, "album", ["name"])).toEqual([
      { name: "Album", artist: "Third Artist" },
      { name: "The Album", artist: "First Artist" },
      { name: "Live Album", artist: "Second Artist" },
    ]);
  });

  test("searches every provided key case-insensitively", () => {
    const items = [
      { name: "Blue Song", album: "Green" },
      { name: "Song One", album: "Blue" },
      { name: "Unrelated", album: "Red" },
    ];

    expect(containSorter(items, "BLUE", ["name", "album"])).toEqual([
      { name: "Blue Song", album: "Green" },
      { name: "Song One", album: "Blue" },
    ]);
  });

  test("returns an empty array when nothing matches", () => {
    expect(
      containSorter([{ name: "One" }, { name: "Two" }], "three", ["name"]),
    ).toEqual([]);
  });
});
