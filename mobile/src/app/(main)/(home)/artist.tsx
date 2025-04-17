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
      getEstimatedItemSize={(index, item) => {
        if (typeof item === "string") return index === 0 ? 14 : 22;
        else return 48;
      }}
      data={data}
      keyExtractor={(item) => (typeof item === "string" ? item : item.name)}
      renderItem={({ item, index }) =>
        typeof item === "string" ? (
          <Em className={index > 0 ? "mt-2" : undefined}>{item}</Em>
        ) : (
          <SearchResult
            {...{ as: "ripple", type: "artist", title: item.name }}
            imageSource={item.artwork}
            onPress={() =>
              router.navigate(`/artist/${encodeURIComponent(item.name)}`)
            }
            wrapperClassName="rounded-full"
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
      columnWrapperStyle={{ rowGap: 8 }}
    />
  );
}
