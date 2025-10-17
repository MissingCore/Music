import type { Prettify } from "~/utils/types";
import type { PressProps } from "~/components/Form/Button";
import type { SearchResult } from "~/modules/search/components/SearchResult";
import type { PlayFromSource } from "~/stores/Playback/types";

export type TrackContent = Required<
  Pick<SearchResult.Content, "title" | "description" | "imageSource">
> & { id: string };

export type TrackProps = Prettify<
  TrackContent &
    Omit<PressProps, "onPress"> & {
      /** Indicate that this track is being played. */
      showIndicator?: boolean;
      trackSource: PlayFromSource;
      LeftElement?: React.JSX.Element;
      /** Note: Maps to `wrapperClassName` on `<SearchResult />`. */
      className?: string;
    }
>;
