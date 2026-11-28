// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { act, renderHook } from "@testing-library/react-native";

import { atom, useAtom } from "../atom";
import { BoundedMap } from "../bounded-map";

describe("atom", () => {
  test("atom returns updated value when changed", async () => {
    const countAtom = atom(0);

    const { result } = await renderHook(() => useAtom(countAtom));
    expect(result.current).toBe(0);

    await act(() => countAtom.set(1));
    expect(result.current).toBe(1);

    await act(() => countAtom.set((prev) => prev + 1));
    expect(result.current).toBe(2);
  });

  test("re-renders when slice changes", async () => {
    const cacheMapAtom = atom(new BoundedMap<string, number>(10));
    const cacheValue = (key: string, val: number) => {
      cacheMapAtom.set((prev) => {
        const nextData = new BoundedMap(10, prev);
        nextData.set(key, val);
        return nextData;
      });
    };

    const cacheKey = "test";

    const rerenderCount = jest.fn();
    const { result } = await renderHook(() => {
      rerenderCount();
      return useAtom(cacheMapAtom, (data) => data.get(cacheKey));
    });
    expect(rerenderCount).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(undefined);

    await act(() => cacheValue("unrelated-key", 0));
    expect(rerenderCount).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(undefined);

    await act(() => cacheValue(cacheKey, 1));
    expect(rerenderCount).toHaveBeenCalledTimes(2);
    expect(result.current).toBe(1);
  });
});
