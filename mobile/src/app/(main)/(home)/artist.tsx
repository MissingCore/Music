import type { FlashListProps } from "@shopify/flash-list";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import type { Artist } from "@/db/schema";

import { useArtistsForIndex } from "@/queries/artist";
import { StickyActionListLayout } from "@/layouts";

import { cn } from "@/lib/style";
import type { Maybe } from "@/utils/types";
import { Loading } from "@/components/Transition";
import { Em, StyledText } from "@/components/Typography";
import { SearchResult } from "@/modules/search/components";

/** Screen for `/artist` route. */
export default function ArtistScreen() {
  const { t } = useTranslation();
  const { isPending, data } = useArtistsForIndex();

  return (
    <StickyActionListLayout
      title={t("common.artists")}
      {...ArtistIndexPreset({
        ...{ data, isPending },
        emptyMessage: t("response.noArtists"),
      })}
    />
  );
}

//#region Preset
const ArtistIndexPreset = (props: {
  data: Maybe<ReadonlyArray<string | Artist>>;
  emptyMessage?: string;
  isPending?: boolean;
}) =>
  ({
    estimatedItemSize: 56, // 48px Height + 8px Margin Top
    data: props.data,
    keyExtractor: (item) => (typeof item === "string" ? item : item.name),
    renderItem: ({ item, index }) =>
      typeof item === "string" ? (
        <Em className={cn({ "mt-4": index !== 0 })}>{item}</Em>
      ) : (
        <SearchResult
          {...{ as: "ripple", type: "artist", title: item.name }}
          onPress={() =>
            router.navigate(`/artist/${encodeURIComponent(item.name)}`)
          }
          wrapperClassName="mt-2 rounded-full"
          className="pr-4"
        />
      ),
    ListEmptyComponent: props.isPending ? (
      <Loading />
    ) : (
      <StyledText center>{props.emptyMessage}</StyledText>
    ),
  }) satisfies FlashListProps<string | Artist>;
//#endregion
