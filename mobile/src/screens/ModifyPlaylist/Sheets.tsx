import { useTheme } from "~/hooks/useTheme";

import { deferInitialRender } from "~/lib/react";
import type { TrueSheetRef } from "~/components/Sheet";
import { Sheet } from "~/components/Sheet";
import { SearchEngine } from "~/modules/search/components/SearchEngine";
import type { SearchCallbacks } from "~/modules/search/types";

/** List of media we want to appear in the search. */
const searchScope = ["album", "track"] as const;

/** Enables us to add music to a playlist. */
export const AddMusicSheet = deferInitialRender(function AddMusicSheet(props: {
  sheetRef: TrueSheetRef;
  callbacks: Pick<SearchCallbacks, (typeof searchScope)[number]>;
}) {
  const { canvasAlt } = useTheme();
  return (
    <Sheet
      ref={props.sheetRef}
      titleKey="feat.search.extra.musicAdd"
      keyboardMode="pan"
      snapTop
    >
      <SearchEngine
        searchScope={searchScope}
        callbacks={props.callbacks}
        bgColor={canvasAlt}
        forSheets
      />
    </Sheet>
  );
});
