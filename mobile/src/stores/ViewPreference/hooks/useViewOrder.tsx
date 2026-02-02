import { useEffect, useMemo, useRef, useState } from "react";

import { useViewPreferenceStore } from "../store";
import type { ScreenSortOptions, SortOptionTypeMap } from "../constants";
import type { MutableViewOrder } from "../types";

/** Orders the data based on the screen. */
export function useViewOrder<
  TScreen extends MutableViewOrder,
  TData extends Pick<SortOptionTypeMap, ScreenSortOptions<TScreen>>,
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
      sortedResults.sort((a, b) => {
        if (orderBy === "artistName") {
          // Put `null` values at the start of the array.
          if (a[orderBy] === null) return -1;
          else if (b[orderBy] === null) return 1;
          return (a[orderBy] as string).localeCompare(b[orderBy] as string);
        } else {
          return (a[orderBy] as number) - (b[orderBy] as number);
        }
      });
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
