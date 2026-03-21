import { DetachedSheet } from "~/components/Sheet";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { SearchEngine } from "~/modules/search/components/SearchEngine";
import type { SearchCallbacks } from "~/modules/search/types";

/** List of media we want to appear in the search. */
const searchScope = ["album", "folder", "track"] as const;

/** Enables us to add music to a playlist. */
export function AddMusicSheet(props: {
  ref: TrueSheetRef;
  callbacks: Pick<SearchCallbacks, (typeof searchScope)[number]>;
}) {
  return (
    <DetachedSheet ref={props.ref} snapTop>
      <SearchEngine
        searchScope={searchScope}
        callbacks={props.callbacks}
        bgColor="surfaceBright"
        forSheets
      />
    </DetachedSheet>
  );
}
