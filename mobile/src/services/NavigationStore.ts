import type { Href } from "expo-router";
import { router } from "expo-router";
import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

interface NavigationStore {
  history: Href[];
  event: "NAVIGATE" | "REPLACE" | "REPLACE_PREV" | null;

  /** Go back if the route already exists in our history. */
  navigate: (href: Href, materialTopTabs?: boolean) => void;
  /** Replace the current route in the stack. */
  replace: (href: Href, previous?: boolean) => void;

  /** How we handle the new route from `usePathname()` based on the event. */
  handleNavigation: (href: Href) => void;
}

export const navigationStore = createStore<NavigationStore>()((set, get) => ({
  history: [],
  event: null,

  navigate: (href, materialTopTabs = false) => {
    if (typeof href === "object")
      throw new Error("Object Href is not supported.");
    const { history } = get();
    // By default, we pass a Href with an encoded chunk.
    const decodedHref = decodeURIComponent(href) as Href;
    // Don't need to navigate if the last route was this route.
    if (history.at(-1) === decodedHref) return;
    const historyIdx = history.findLastIndex((route) => route === decodedHref);
    set({ event: "NAVIGATE" });
    if (historyIdx !== -1) {
      if (!materialTopTabs) router.dismiss(history.length - 1 - historyIdx);
      else {
        // None of the `router.dismiss*()` methods work with the Material
        // Top Tabs navigator, so we have to manually call `router.back()`
        // to the route we want to get to.
        for (let i = history.length - 1 - historyIdx; i > 0; i--) {
          router.back();
        }
      }
    }
    // If we navigated from the "Now Playing" screen, replace the current route.
    else if (history.at(-1) === "/now-playing") router.replace(href);
    else router.push(href);
  },
  replace: (href, previous = false) => {
    // Setting `previous = true` means we called a `router.back()` prior.
    set({ event: `REPLACE${previous ? "_PREV" : ""}` });
    router.replace(href);
  },

  handleNavigation: (href) => {
    switch (get().event) {
      case "REPLACE":
        set((prev) => ({
          history: [...prev.history.slice(0, -1), href],
          event: null,
        }));
        break;
      case "REPLACE_PREV":
        // `handleNavigation()` will be called twice in this case. First by
        // the `router.back()`, then by the `router.replace()`. The href of
        // the route we're going to will be added via the default case.
        set((prev) => ({ history: prev.history.slice(0, -2), event: null }));
        break;
      // The default case handles the "NAVIGATE" event and "back" event.
      default:
        set((prev) => {
          let prevHist: Href[] = prev.history;
          const lastFound = prevHist.findLastIndex((route) => route === href);
          // Pop to last occurrence.
          if (lastFound !== -1) prevHist = prevHist.slice(0, lastFound);
          // If we navigated from the "Now Playing" screen, replace the current route.
          else if (prevHist.at(-1) === "/now-playing")
            prevHist = prevHist.slice(0, -1);

          return { history: [...prevHist, href], event: null };
        });
    }
  },
}));

export const useNavigationStore = <T>(
  selector: (state: NavigationStore) => T,
): T => useStore(navigationStore, selector);

export class Router {
  /** Go back if the route already exists in our history. */
  static navigate(href: Href) {
    navigationStore.getState().navigate(href);
  }

  /** `Router.navigate()` method for Material Top Tabs navigator. */
  static navigateMTT(href: Href) {
    navigationStore.getState().navigate(href, true);
  }

  /** Replace the current route in the stack. */
  static replace(href: Href) {
    navigationStore.getState().replace(href);
  }

  /** For when we go back and then replace the previous route. */
  static replacePrev(href: Href) {
    navigationStore.getState().replace(href, true);
  }
}
