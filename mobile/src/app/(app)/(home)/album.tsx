import { FlashList } from "@shopify/flash-list";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useAlbumsForMediaCard } from "@/api/albums";
import { useGetColumn } from "@/hooks/useGetColumn";
import { StickyActionLayout } from "@/layouts/StickyActionLayout";

import { StyledText } from "@/components/new/Typography";
import { MediaCard } from "@/modules/media/components";

/** Screen for `/album` route. */
export default function AlbumScreen() {
  const { t } = useTranslation();
  const { count, width } = useGetColumn({
    ...{ cols: 2, gap: 16, gutters: 32, minWidth: 175 },
  });
  const { data } = useAlbumsForMediaCard();

  return (
    <StickyActionLayout title={t("common.albums")}>
      <FlashList
        numColumns={count}
        estimatedItemSize={width + 40}
        data={data}
        keyExtractor={({ href }) => href}
        renderItem={({ item }) => (
          <View className="mx-2 mb-4">
            <MediaCard {...item} size={width} />
          </View>
        )}
        ListEmptyComponent={
          <StyledText center>{t("response.noAlbums")}</StyledText>
        }
        showsVerticalScrollIndicator={false}
        className="-m-2 mt-0"
      />
    </StickyActionLayout>
  );
}
