import { router } from "expo-router";

import { useArtistsForIndex } from "~/queries/artist";
import { StickyActionListLayout } from "~/layouts/StickyActionScroll";

import { ContentPlaceholder } from "~/components/Transition/Placeholder";
import { Em } from "~/components/Typography/StyledText";
import { SearchResult } from "~/modules/search/components/SearchResult";

/** Screen for `/artist` route. */
export default function ArtistScreen() {
  const { isPending, data } = useArtistsForIndex();
  return (
    <StickyActionListLayout
      titleKey="term.artists"
      estimatedItemSize={56} // 48px Height + 8px Margin Top
      data={data}
      keyExtractor={(item) => (typeof item === "string" ? item : item.name)}
      renderItem={({ item, index }) =>
        typeof item === "string" ? (
          <Em className={index > 0 ? "mt-4" : undefined}>{item}</Em>
        ) : (
          <SearchResult
            {...{ as: "ripple", type: "artist", title: item.name }}
            imageSource={item.artwork}
            onPress={() =>
              router.navigate(`/artist/${encodeURIComponent(item.name)}`)
            }
            wrapperClassName="mt-2 rounded-full"
            className="pr-4"
          />
        )
      }
      ListEmptyComponent={
        <ContentPlaceholder
          isPending={isPending}
          errMsgKey="err.msg.noArtists"
        />
      }
    />
  );
}
