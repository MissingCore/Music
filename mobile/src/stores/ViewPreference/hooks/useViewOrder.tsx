import { useEffect, useMemo, useRef, useState } from "react";

import { useViewPreferenceStore } from "../store";
import type { ScreenSortOptions } from "../constants";
import type { MutableOrder } from "../types";

/** Orders the data based on the screen. */
export function useViewOrder<
  TScreen extends MutableOrder,
  TData extends Record<string, any>,
>(
  screen: TScreen,
  data: TData[] = [],
  /** `null` strategy should only be used for the default order. */
  sortStrategies: Record<
    ScreenSortOptions<TScreen>,
    ((a: TData, b: TData) => number) | null
  >,
) {
  const isAsc = useViewPreferenceStore((s) => s[`${screen}IsAsc`]);
  const orderBy = useViewPreferenceStore((s) => s[`${screen}Order`]);
  const [cachedComputation, setCachedComputation] = useState<
    Record<string, TData[]>
  >({});
  const dataCache = useRef(data);

  const sortedData = useMemo(() => {
    const cacheKey = `${orderBy}__${isAsc}`;
    if (cachedComputation[cacheKey]) return cachedComputation[cacheKey];

    const sortedResults = [...dataCache.current];
    if (sortStrategies[orderBy] !== null) {
      sortedResults.sort(sortStrategies[orderBy]);
    }
    if (!isAsc) sortedResults.reverse();

    setCachedComputation((prev) => ({ ...prev, [cacheKey]: sortedResults }));
    return sortedResults;
  }, [isAsc, orderBy, sortStrategies, cachedComputation]);

  useEffect(() => {
    if (data !== dataCache.current) {
      setCachedComputation({});
      dataCache.current = data;
    }
  }, [data]);

  return sortedData;
}
