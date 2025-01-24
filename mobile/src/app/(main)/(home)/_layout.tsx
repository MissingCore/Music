import type {
  EventArg,
  ParamListBase,
  TabNavigationState,
} from "@react-navigation/native";
import { useCallback, useMemo, useRef } from "react";

import { useTabsByVisibility } from "~/services/UserPreferences";
import { MaterialTopTabs } from "~/layouts/MaterialTopTabs";

type TabState = EventArg<
  "state",
  any,
  { state: TabNavigationState<ParamListBase> }
>;

export default function HomeLayout() {
  const { displayedTabs, hiddenTabs } = useTabsByVisibility();
  // Should be fine to store navigation state in ref as it doesn't affect rendering.
  //  - https://react.dev/learn/referencing-values-with-refs#when-to-use-refs
  const prevTabState = useRef<TabState>();

  /** Have Tab history operate like Stack history. */
  const manageAsStackHistory = useCallback(
    (e: TabState) => {
      if (prevTabState.current) {
        // Get top of history.
        const currRoute = e.data.state.history.at(-1)!;
        const currIndex = e.data.state.index;
        // See if route was seen previously.
        const oldHistory = prevTabState.current.data.state.history;
        const atIndex = oldHistory.findIndex((r) => currRoute.key === r.key);
        // Handle if we visited this tab earlier.
        if (atIndex !== -1) {
          // FIXME: Modifying the value in `e` for some reason modifies the
          // original reference (even if we cloned `e` via object spreading).
          //  - This might be fragile code, so we might swap over to the use
          //  of the `reset` function.
          //  - https://reactnavigation.org/docs/navigation-actions/#reset
          e.data.state.history = oldHistory
            .toSpliced(currIndex === atIndex ? atIndex + 1 : 1)
            .filter((r) => !hiddenTabs.some((t) => r.key.startsWith(`${t}-`)));
        }
      }
      prevTabState.current = e;
    },
    [hiddenTabs],
  );

  const listeners = useMemo(
    () => ({ state: manageAsStackHistory }),
    [manageAsStackHistory],
  );

  return (
    <MaterialTopTabs
      initialRouteName="index"
      backBehavior="history"
      tabBar={noop}
      screenListeners={listeners}
    >
      <MaterialTopTabs.Screen name="index" />
      {displayedTabs.map((tabKey) => (
        <MaterialTopTabs.Screen key={tabKey} name={tabKey} />
      ))}
      {hiddenTabs.map((tabKey) => (
        <MaterialTopTabs.Screen key={tabKey} name={tabKey} redirect />
      ))}
    </MaterialTopTabs>
  );
}

const noop = () => null;
