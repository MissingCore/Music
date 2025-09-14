import { useArtistsForIndex } from "~/queries/artist";
import { router } from "../../utils/router";
import { StickyActionListLayout } from "~/layouts/StickyActionScroll";

import { isString } from "~/utils/validation";
import { ContentPlaceholder } from "~/components/Transition/Placeholder";
import { Em } from "~/components/Typography/StyledText";
import { SearchResult } from "~/modules/search/components/SearchResult";

export default function Artists() {
  const { isPending, data } = useArtistsForIndex();
  return (
    <StickyActionListLayout
      titleKey="term.artists"
      estimatedItemSize={56} // 48px Height + 8px Margin Top
      data={data}
      keyExtractor={(item) => (isString(item) ? item : item.name)}
      getItemType={(item) => (isString(item) ? "label" : "row")}
      renderItem={({ item, index }) =>
        isString(item) ? (
          <Em className={index > 0 ? "mt-4" : undefined}>{item}</Em>
        ) : (
          <SearchResult
            as="ripple"
            type="artist"
            title={item.name}
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
