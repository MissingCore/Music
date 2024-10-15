import { FlashList } from "@shopify/flash-list";
import { useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Add } from "@/resources/icons";
import { usePlaylistsForMediaCard } from "@/api/playlists";
import { useGetColumn } from "@/hooks/useGetColumn";
import { StickyActionLayout } from "@/layouts/StickyActionLayout";
import { mediaModalAtom } from "@/modals/categories/media/store";

import { Colors } from "@/constants/Styles";
import { Button } from "@/components/new/Form";
import { StyledText } from "@/components/new/Typography";
import { MediaCard } from "@/modules/media/components";

/** Screen for `/playlist` route. */
export default function PlaylistScreen() {
  const { t } = useTranslation();
  const { count, width } = useGetColumn({
    ...{ cols: 2, gap: 16, gutters: 32, minWidth: 175 },
  });
  const { data } = usePlaylistsForMediaCard();
  const openModal = useSetAtom(mediaModalAtom);

  return (
    <StickyActionLayout
      title={t("common.playlists")}
      StickyAction={
        <Button
          preset="danger"
          // FIXME: Temporary until we implement the new "Create Playlist" screen.
          onPress={() => openModal({ entity: "playlist", scope: "new" })}
          icon
        >
          <Add color={Colors.neutral100} />
        </Button>
      }
    >
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
          <StyledText center>{t("response.noPlaylists")}</StyledText>
        }
        showsVerticalScrollIndicator={false}
        className="-m-2 mt-0"
      />
    </StickyActionLayout>
  );
}
