import { useTheme } from "~/hooks/useTheme";

import { Sheet } from "~/components/Sheet";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { SearchEngine } from "~/modules/search/components/SearchEngine";
import type { SearchCallbacks } from "~/modules/search/types";
import { deferInitialRender } from "../../../components/DeferredRender";

/** List of media we want to appear in the search. */
const searchScope = ["album", "folder", "track"] as const;

/** Enables us to add music to a playlist. */
export const AddMusicSheet = deferInitialRender(function AddMusicSheet(props: {
  ref: TrueSheetRef;
  callbacks: Pick<SearchCallbacks, (typeof searchScope)[number]>;
}) {
  const { canvasAlt } = useTheme();
  return (
    <Sheet
      ref={props.ref}
      titleKey="feat.search.extra.musicAdd"
      keyboardAndToast
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
