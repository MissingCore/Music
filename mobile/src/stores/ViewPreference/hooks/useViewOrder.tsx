import { useEffect, useMemo, useRef, useState } from "react";

import { useViewPreferenceStore } from "../store";
import type { ScreenSortOptions } from "../constants";
import type { MutableViewOrder } from "../types";

/** Orders the data based on the screen. */
export function useViewOrder<
  TScreen extends MutableViewOrder,
  TData extends Record<ScreenSortOptions<TScreen>, any>,
>(screen: TScreen, data: TData[] = []) {
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
    //? By default, data should be sorted by the `name` field.
    if (orderBy !== "name" && sortedResults.length > 0) {
      const dataType = typeof sortedResults[0]?.[orderBy];
      if (dataType === "number" || dataType === "string") {
        sortedResults.sort((a, b) => {
          if (dataType === "number") return a[orderBy] - b[orderBy];
          return a[orderBy].localeCompare(b[orderBy]);
        });
      }
    }
    if (!isAsc) sortedResults.reverse();

    setCachedComputation((prev) => ({ ...prev, [cacheKey]: sortedResults }));
    return sortedResults;
  }, [isAsc, orderBy, cachedComputation]);

  useEffect(() => {
    if (data !== dataCache.current) {
      setCachedComputation({});
      dataCache.current = data;
    }
  }, [data]);

  return sortedData;
}
