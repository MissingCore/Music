import { useDelayedReady } from "~/hooks/useDelayedReady";

/**
 * Delay the initial render of a functional component by a set amount of
 * milliseconds (defaults to `1ms`).
 *
 * Useful for delaying the render of a component might stall the JS thread.
 */
export function deferInitialRender<T, U extends React.FunctionComponent<T>>(
  RenderedComponent: U,
  delayMs = 1,
) {
  return function DeferredRender(props: React.ComponentProps<U>) {
    const shouldRender = useDelayedReady(delayMs);
    if (!shouldRender) return null;
    // @ts-expect-error - Props can be forwarded.
    return <RenderedComponent {...props} />;
  };
}

/**
 * Delay the initial render of children by a set amount of milliseconds
 *  (defaults to `1ms`).
 */
export function DeferRender(props: {
  /** Defaults to `1ms`. */
  delayMs?: number;
  children: React.ReactNode;
}) {
  const shouldRender = useDelayedReady(props.delayMs ?? 1);
  if (!shouldRender) return null;
  return props.children;
}
