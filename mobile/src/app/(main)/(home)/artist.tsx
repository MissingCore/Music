import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { getArtists } from "@/db/queries";

import { StickyActionLayout } from "@/layouts/StickyActionLayout";

import { artistKeys } from "@/constants/QueryKeys";
import { cn } from "@/lib/style";
import { Ripple } from "@/components/new/Form";
import { Loading } from "@/components/new/Loading";
import { StyledText } from "@/components/new/Typography";
import { MediaImage } from "@/modules/media/components";

/** Screen for `/artist` route. */
export default function ArtistScreen() {
  const { t } = useTranslation();
  const { isPending, data } = useArtistsForList();

  return (
    <StickyActionLayout title={t("common.artists")}>
      <FlashList
        estimatedItemSize={64} // 48px Height + 16px Margin Top
        data={data}
        // Rare case where `keyExtractor` may break is when there's an
        // artist name that's a single character.
        keyExtractor={(item) => (typeof item === "string" ? item : item.name)}
        renderItem={({ item, index }) =>
          typeof item === "string" ? (
            <StyledText className={cn("text-xs", { "mt-6": index !== 0 })}>
              {item}
            </StyledText>
          ) : (
            <View className="mt-4">
              <Ripple
                onPress={() =>
                  router.navigate(`/artist/${encodeURIComponent(item.name)}`)
                }
                wrapperClassName="rounded-full"
                className="p-0 pr-4"
              >
                <MediaImage type="artist" size={48} source={null} />
                <StyledText numberOfLines={1} className="shrink grow">
                  {item.name}
                </StyledText>
              </Ripple>
            </View>
          )
        }
        ListEmptyComponent={
          isPending ? (
            <Loading />
          ) : (
            <StyledText center>{t("response.noArtists")}</StyledText>
          )
        }
        showsVerticalScrollIndicator={false}
      />
    </StickyActionLayout>
  );
}

//#region Data
const useArtistsForList = () =>
  useQuery({
    queryKey: artistKeys.all,
    queryFn: () => getArtists(),
    staleTime: Infinity,
    select: (data) => {
      // Group artists by their 1st character.
      const groupedArtists: Record<string, typeof data> = {};
      data.forEach((artist) => {
        const key = /[a-zA-Z]/.test(artist.name.charAt(0))
          ? artist.name.charAt(0).toUpperCase()
          : "#";
        if (Object.hasOwn(groupedArtists, key))
          groupedArtists[key]!.push(artist);
        else groupedArtists[key] = [artist];
      });

      // Convert object to array, sort by character key and artist name,
      // then flatten to be used in a `<FlashList />`.
      return Object.entries(groupedArtists)
        .map(([character, arts]) => ({
          title: character,
          data: arts.sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { caseFirst: "upper" }),
          ),
        }))
        .sort((a, b) => a.title.localeCompare(b.title))
        .map(({ title, data }) => [title, ...data])
        .flat();
    },
  });
//#endregion
