import { useDelayedReady } from "~/hooks/useDelayedReady";

/**
 * Delay the initial render of children by a set amount of milliseconds
 * (defaults to `75ms`).
 *
 * Useful in React Navigation v7 as async actions are fired before the
 * screen is mounted, leading to a longer visual delay compared to v6.
 */
export function DeferredRender(props: {
  /** Defaults to `1ms`. */
  delayMs?: number;
  children: React.ReactNode;
}) {
  const shouldRender = useDelayedReady(props.delayMs ?? 75);
  if (!shouldRender) return null;
  return props.children;
}
