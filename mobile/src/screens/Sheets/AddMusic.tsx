import { useTheme } from "@/hooks/useTheme";

import { Sheet } from "@/components/Sheet";
import { SearchEngine } from "@/modules/search/components";
import type { SearchCallbacks } from "@/modules/search/types";

/** List of media we want to appear in the search. */
const searchScope = ["album", "track"] as const;

/** Sheet allowing us to add music to a playlist. */
export default function AddMusicSheet(props: {
  payload: { callbacks: Pick<SearchCallbacks, "album" | "track"> };
}) {
  const { canvasAlt } = useTheme();
  return (
    <Sheet id="AddMusicSheet" titleKey="title.musicAdd" snapTop>
      <SearchEngine
        searchScope={searchScope}
        callbacks={props.payload.callbacks}
        bgColor={canvasAlt}
        withGesture
      />
    </Sheet>
  );
}
