import { useCallback, useMemo } from "react";

import { INACTIVE, useDragListStore } from "./store";

export function useDragListState(index: number) {
  const _onInitDrag = useDragListStore((s) => s.onInitDrag);
  const isDragging = useDragListStore(
    (s) => s.reactiveActiveIndex !== INACTIVE,
  );
  const isActive = useDragListStore((s) => s.reactiveActiveIndex === index);

  const onInitDrag = useCallback(
    () => _onInitDrag(index),
    [_onInitDrag, index],
  );

  return useMemo(
    () => ({ isActive, isDragging, onInitDrag }),
    [isActive, isDragging, onInitDrag],
  );
}
