import { useCallback, useEffect, useState } from "react";

import { moveArray } from "@/utils/object";

/**
 * Hook that returns a localized state synchronized with its source to
 * prevent the jankiness from rendering data from an async source.
 */
export function useDragListState<T>(args: {
  /** Asynchronous data rendered in the drag list. */
  data: T[] | undefined;
  /** Function called when we moved an item in the drag list to its new location. */
  onMove: (fromIndex: number, toIndex: number) => Promise<void> | void;
}) {
  const [items, setItems] = useState<T[]>([]);

  const onReordered = useCallback(
    async (fromIndex: number, toIndex: number) => {
      setItems((prev) => moveArray(prev, { fromIndex, toIndex }));
      await args.onMove(fromIndex, toIndex);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [args.onMove],
  );

  // Synchronize local state with async data.
  useEffect(() => {
    if (args.data && Array.isArray(args.data)) setItems(args.data);
  }, [args.data]);

  return { items, onReordered };
}
