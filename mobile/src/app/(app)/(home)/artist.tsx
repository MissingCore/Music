import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useArtistsForList } from "@/api/artists";
import { StickyActionLayout } from "@/layouts/StickyActionLayout";

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
        estimatedItemSize={48}
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
                className="flex-row items-center justify-start gap-2 p-0 pr-4"
              >
                <MediaImage type="artist" size={48} source={null} />
                <StyledText numberOfLines={1}>{item.name}</StyledText>
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
