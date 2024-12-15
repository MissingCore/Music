import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { useArtistsForIndex } from "@/queries/artist";
import { StickyActionListLayout } from "@/layouts";

import { Loading } from "@/components/Transition";
import { Em, StyledText } from "@/components/Typography";
import { SearchResult } from "@/modules/search/components";

/** Screen for `/artist` route. */
export default function ArtistScreen() {
  const { t } = useTranslation();
  const { isPending, data } = useArtistsForIndex();

  return (
    <StickyActionListLayout
      titleKey="common.artists"
      estimatedItemSize={56} // 48px Height + 8px Margin Top
      data={data}
      keyExtractor={(item) => (typeof item === "string" ? item : item.name)}
      renderItem={({ item, index }) =>
        typeof item === "string" ? (
          <Em className={index > 0 ? "mt-4" : undefined}>{item}</Em>
        ) : (
          <SearchResult
            {...{ as: "ripple", type: "artist", title: item.name }}
            onPress={() =>
              router.navigate(`/artist/${encodeURIComponent(item.name)}`)
            }
            wrapperClassName="mt-2 rounded-full"
            className="pr-4"
          />
        )
      }
      ListEmptyComponent={
        isPending ? (
          <Loading />
        ) : (
          <StyledText center>{t("response.noArtists")}</StyledText>
        )
      }
    />
  );
}
