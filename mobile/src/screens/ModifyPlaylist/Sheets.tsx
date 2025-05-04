import type { ActionSheetRef } from "react-native-actions-sheet";

import { useTheme } from "~/hooks/useTheme";

import { Sheet } from "~/components/Sheet";
import { SearchEngine } from "~/modules/search/components/SearchEngine";
import type { SearchCallbacks } from "~/modules/search/types";

/** List of media we want to appear in the search. */
const searchScope = ["album", "track"] as const;

/** Enables us to add music to a playlist. */
export function AddMusicSheet(props: {
  sheetRef: React.RefObject<ActionSheetRef>;
  callbacks: Pick<SearchCallbacks, (typeof searchScope)[number]>;
}) {
  const { canvasAlt } = useTheme();
  return (
    <Sheet ref={props.sheetRef} titleKey="feat.search.extra.musicAdd" snapTop>
      <SearchEngine
        searchScope={searchScope}
        callbacks={props.callbacks}
        bgColor={canvasAlt}
        withGesture
      />
    </Sheet>
  );
}
