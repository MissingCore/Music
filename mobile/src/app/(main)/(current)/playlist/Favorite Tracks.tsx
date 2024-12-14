import { FlashList } from "@shopify/flash-list";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useFavoriteTracksForScreen } from "@/queries/favorite";
import { useBottomActionsContext } from "@/hooks/useBottomActionsContext";
import { CurrentListLayout } from "@/layouts/CurrentList";

import { StyledText } from "@/components/Typography";
import { TrackListPreset } from "@/modules/media/components";

/** Screen for displaying favorited tracks. */
export default function FavoriteTracksScreen() {
  const { t } = useTranslation();
  const { bottomInset } = useBottomActionsContext();
  const { isPending, error, data } = useFavoriteTracksForScreen();

  if (isPending) return <View className="w-full flex-1 px-4" />;
  else if (error) {
    return (
      <View className="w-full flex-1 p-4">
        <StyledText center>{t("response.noContent")}</StyledText>
      </View>
    );
  }

  // Information about this track list.
  const trackSource = { type: "playlist", id: data.name } as const;

  return (
    <CurrentListLayout
      title={data.name}
      metadata={data.metadata}
      imageSource={data.imageSource}
      mediaSource={trackSource}
    >
      <FlashList
        {...TrackListPreset({
          ...{ data: data.tracks, trackSource },
          emptyMessage: t("response.noTracks"),
        })}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        className="mx-4"
        contentContainerClassName="pt-4"
        contentContainerStyle={{ paddingBottom: bottomInset.onlyPlayer + 16 }}
      />
    </CurrentListLayout>
  );
}
