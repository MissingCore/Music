import { atom, useSetAtom } from "jotai";
import { usePathname } from "expo-router";
import { useEffect, useRef } from "react";

export const prevPathnameAtom = atom("/");

/** @description Keeps `prevPathnameAtom` up-to-date for error handling. */
export function PrevPathnameTracker() {
  const pathname = usePathname();
  const setPathname = useSetAtom(prevPathnameAtom);
  const prevPathname = useRef("/");

  useEffect(() => {
    setPathname(prevPathname.current);
    prevPathname.current = pathname;
  }, [setPathname, pathname]);

  return null;
}
