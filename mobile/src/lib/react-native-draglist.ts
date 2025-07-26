import type { DragListRenderItemInfo } from "react-native-draglist/dist/FlashList";

type EqualityFn<T> = (
  oldProps: DragListRenderItemInfo<T>,
  newProps: DragListRenderItemInfo<T>,
) => boolean;

// Props that should account to re-rendering (ie: ignore functions).
const primitiveProps = ["index", "isActive", "isDragging"] as const;

/** Custom memoization function to determine when the item should be re-rendered. */
export function areRenderItemPropsEqual<T>(
  itemEqualityFn: EqualityFn<T>,
): EqualityFn<T> {
  return (oldProps, newProps) =>
    itemEqualityFn(oldProps, newProps) &&
    primitiveProps.every((key) => oldProps[key] === newProps[key]);
}
