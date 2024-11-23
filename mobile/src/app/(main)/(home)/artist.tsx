import type { FlashListProps } from "@shopify/flash-list";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import type { Artist } from "@/db/schema";

import { useArtistsForIndex } from "@/queries/artist";
import { StickyActionListLayout } from "@/layouts";

import { cn } from "@/lib/style";
import type { Maybe } from "@/utils/types";
import { Ripple } from "@/components/Form";
import { Loading } from "@/components/Loading";
import { StyledText } from "@/components/Typography";
import { MediaImage } from "@/modules/media/components";

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
    estimatedItemSize: 64, // 48px Height + 16px Margin Top
    data: props.data,
    keyExtractor: (item) => (typeof item === "string" ? item : item.name),
    renderItem: ({ item, index }) =>
      typeof item === "string" ? (
        <StyledText className={cn("text-xs", { "mt-6": index !== 0 })}>
          {item}
        </StyledText>
      ) : (
        <Ripple
          onPress={() =>
            router.navigate(`/artist/${encodeURIComponent(item.name)}`)
          }
          wrapperClassName="rounded-full mt-4"
          className="pr-4"
        >
          <MediaImage type="artist" size={48} source={null} />
          <StyledText numberOfLines={1} className="shrink grow">
            {item.name}
          </StyledText>
        </Ripple>
      ),
    ListEmptyComponent: props.isPending ? (
      <Loading />
    ) : (
      <StyledText center>{props.emptyMessage}</StyledText>
    ),
  }) satisfies FlashListProps<string | Artist>;
//#endregion
