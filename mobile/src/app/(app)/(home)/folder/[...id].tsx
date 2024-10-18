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
import { StyledText } from "@/components/new/Typography";
import { MediaImage, TrackNew } from "@/modules/media/components";

import { LoadingIndicator } from "@/components/ui/loading";

/** Screen for `/folder/[id]` route. */
export default function FolderScreen() {
  const { t } = useTranslation();
  const { bottomInset } = useBottomActionsLayout();
  const { id } = useLocalSearchParams<{ id: string[] }>();
  const navigation = useNavigation();
  const updateFolderPath = useSetAtom(folderPathAtom);

  const fullPath = id?.join("/");

  const { isPending, error, data } = useFolderContentForPath(fullPath);

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

  if (isPending) {
    return (
      <View className="w-full flex-1 items-center px-4">
        <LoadingIndicator />
      </View>
    );
  } else if (error) {
    return (
      <View className="w-full flex-1 px-4">
        <StyledText center>{t("response.noDirectory")}</StyledText>
      </View>
    );
  } else if (data.subDirectories.length === 0 && data.tracks.length === 0) {
    return (
      <View className="w-full flex-1 px-4">
        <StyledText center>{t("response.noContent")}</StyledText>
      </View>
    );
  }

  // Information about this track list.
  const trackSource = {
    type: "folder",
    // Theoretically, no tracks should be on the "root" (ie: `id = undefined`),
    // so we shouldn't see any cases where we play a track from the
    // invalid track source "id" created.
    id: `${fullPath}/`,
  } as const;

  const folderData = [...data.subDirectories, undefined, ...data.tracks];

  return (
    <FlashList
      estimatedItemSize={48}
      data={folderData}
      keyExtractor={(_, index) => `${index}`}
      renderItem={({ item, index }) => {
        // "Divider" between found directories & tracks.
        if (item === undefined) {
          if (data.subDirectories.length > 0 && data.tracks.length > 0)
            return <View className="mb-4" />;
          else return null;
        }
        return (
          <View className={cn({ "mb-2": index !== folderData.length - 1 })}>
            {isTrackContent(item) ? (
              <TrackNew
                id={item.id}
                trackSource={trackSource}
                imageSource={item.imageSource}
                // FIXME: Need to fix the below
                // @ts-ignore We haven't updated the function used to get the data.
                title={item.textContent[0]}
                // @ts-ignore We haven't updated the function used to get the data.
                description={item.textContent[1]}
              />
            ) : (
              <Ripple
                onPress={() =>
                  router.push(
                    `/folder/${id ? `${id.map((segment) => encodeURIComponent(segment)).join("/")}/` : ""}${encodeURIComponent(item.name)}`,
                  )
                }
                wrapperClassName="rounded-sm"
                className="flex-row items-center justify-start gap-2 p-0 pr-4"
              >
                <MediaImage type="folder" size={48} source={null} radius="sm" />
                <StyledText numberOfLines={1}>{item.name}</StyledText>
              </Ripple>
            )}
          </View>
        );
      }}
      showsVerticalScrollIndicator={false}
      // Add `24px` due to it being applied by the gap in `<StickyActionLayout />`.
      contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
    />
  );
}

function isTrackContent(data: unknown): data is TrackNew.Content {
  return Object.hasOwn(data as TrackNew.Content, "id");
}
