import { FlashList } from "@shopify/flash-list";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useBottomActionsLayout } from "@/hooks/useBottomActionsLayout";
import { useFolderContentForPath } from "@/api/file-nodes/[...id]";
import { folderPathAtom } from "./_layout";

import { cn } from "@/lib/style";
import { Ripple } from "@/components/new/Form";
import { Loading } from "@/components/new/Loading";
import { StyledText } from "@/components/new/Typography";
import { MediaImage, Track } from "@/modules/media/components";

/** Screen for `/folder/[id]` route. */
export default function FolderScreen() {
  const { t } = useTranslation();
  const { bottomInset } = useBottomActionsLayout();
  const { id } = useLocalSearchParams<{ id: string[] }>();
  const navigation = useNavigation();
  const updateFolderPath = useSetAtom(folderPathAtom);

  const fullPath = id?.join("/");

  const { isPending, data } = useFolderContentForPath(fullPath);

  useEffect(() => {
    function onFocus() {
      updateFolderPath(id ?? []);
    }
    // Update breadcrumb (whenever we navigate to this screen or "pop"
    // back on this screen).
    navigation.addListener("focus", onFocus);
    return () => {
      navigation.removeListener("focus", onFocus);
    };
  }, [id, navigation, updateFolderPath]);

  // Information about this track list.
  const trackSource = {
    type: "folder",
    // Theoretically, no tracks should be on the "root" (ie: `id = undefined`),
    // so we shouldn't see any cases where we play a track from the
    // invalid track source "id" created.
    id: `${fullPath}/`,
  } as const;

  const folderData = [data?.subDirectories ?? [], data?.tracks ?? []].flat();

  return (
    <FlashList
      estimatedItemSize={48}
      data={folderData}
      keyExtractor={(_, index) => `${index}`}
      renderItem={({ item, index }) => (
        <View className={cn({ "mb-2": index !== folderData.length - 1 })}>
          {isTrackContent(item) ? (
            <Track {...{ ...item, trackSource }} />
          ) : (
            <Ripple
              onPress={() =>
                router.push(
                  `/folder/${id ? `${id.map((segment) => encodeURIComponent(segment)).join("/")}/` : ""}${encodeURIComponent(item.name)}`,
                )
              }
              wrapperClassName="rounded-sm"
              className="p-0 pr-4"
            >
              <MediaImage type="folder" size={48} source={null} radius="sm" />
              <StyledText numberOfLines={1} className="shrink grow">
                {item.name}
              </StyledText>
            </Ripple>
          )}
        </View>
      )}
      ListEmptyComponent={
        isPending ? (
          <Loading />
        ) : (
          <StyledText center>{t("response.noContent")}</StyledText>
        )
      }
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: bottomInset }}
    />
  );
}

function isTrackContent(data: unknown): data is Track.Content {
  return Object.hasOwn(data as Track.Content, "id");
}
