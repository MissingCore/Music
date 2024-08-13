import { unwrap } from "jotai/utils";

import { createAtomWithStorage } from "@/lib/jotai";

/** [🇫🇴🇷 🇮🇳🇹🇪🇷🇳🇦🇱 🇺🇸🇪 🇴🇳🇱🇾] */
export const allowListAsyncAtom = createAtomWithStorage<string[]>(
  "directory-allowlist",
  [],
);
/** Reference the list of directories we can discover tracks from. */
export const allowListAtom = unwrap(allowListAsyncAtom, (prev) => prev ?? []);

/** [🇫🇴🇷 🇮🇳🇹🇪🇷🇳🇦🇱 🇺🇸🇪 🇴🇳🇱🇾] */
export const blockListAsyncAtom = createAtomWithStorage<string[]>(
  "directory-blocklist",
  [],
);
/** Reference the list of directories we want to ignore. */
export const blockListAtom = unwrap(blockListAsyncAtom, (prev) => prev ?? []);
