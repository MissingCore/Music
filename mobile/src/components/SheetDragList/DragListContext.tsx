import type { Dispatch, SetStateAction } from "react";
import { createContext, use, useMemo, useState } from "react";
import type { SharedValue } from "react-native-reanimated";

export type ActiveData = { key: string; index: number };
export type LayoutContext = { height: number; y: number };

type DragListContextArgs<TData> = {
  keyExtractor: (item: TData, index: number) => string;

  activeData: ActiveData | null;
  pan: SharedValue<number>;
};

type DragListContextProps<TData> = DragListContextArgs<TData> & {
  layoutCache: Record<string, LayoutContext>;
  setLayoutCache: Dispatch<SetStateAction<LayoutContext>>;
};

const DragListContext = createContext<DragListContextProps<any> | null>(null);

export function DragListProvider<TData>({
  children,
  ...props
}: DragListContextArgs<TData> & { children: React.ReactNode }) {
  const [layoutCache, setLayoutCache] = useState({});

  const value = useMemo(
    () => ({ ...props, layoutCache, setLayoutCache }),
    [props, layoutCache, setLayoutCache],
  );

  return <DragListContext value={value}>{children}</DragListContext>;
}

export function useDragListContext<TData>() {
  const value = use(DragListContext);
  if (!value)
    throw new Error(
      "`useDragListContext` must be used inside a `DragListProvider`.",
    );
  return value as DragListContextProps<TData>;
}
