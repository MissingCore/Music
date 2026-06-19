import { useNavigation, useNavigationState } from "@react-navigation/native";
import { Portal } from "@rn-primitives/portal";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, { SlideInUp, SlideOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TrackMultiSelect, useTrackMultiSelectStore } from "../core/store";
import {
  favoriteSelected,
  hideSelected,
  removeSelectedFromPlaylist,
} from "../core/actions";

import { FilledIconButton } from "~/components/Form/Button/Icon";
import { TopDownGradient } from "~/components/Gradient";
import { ConfirmableAction } from "~/components/Modal";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { StyledText } from "~/components/Typography/StyledText";
import { AddToCreatedPlaylistSheet } from "./AddToCreatedPlaylistSheet";
import { AddToPlaylistsSheet } from "./AddToPlaylistsSheet";
import { FavoritesPlaylistKey } from "../../constants";

export function TrackMultiSelectListeners() {
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener("state", TrackMultiSelect.reset);
    return () => unsubscribe();
  }, [navigation]);

  return <TrackMultiSelectMenu />;
}

//#region Selection Menu
const ESTIMATED_MENU_HEIGHT = 100;

export function TrackMultiSelectMenu() {
  const insets = useSafeAreaInsets();
  const isMultiSelectEnabled = useTrackMultiSelectStore((s) => s.enabled);
  const addToCreatedPlaylistSheetRef = useSheetRef();
  const addToPlaylistsSheetRef = useSheetRef();

  return isMultiSelectEnabled ? (
    <Portal name="track-multi-select-menu-portal">
      <AddToCreatedPlaylistSheet ref={addToCreatedPlaylistSheetRef} />
      <AddToPlaylistsSheet ref={addToPlaylistsSheetRef} />

      <Animated.View
        entering={SlideInUp}
        exiting={SlideOutUp}
        style={{ paddingTop: insets.top }}
        className="absolute top-0 right-0 left-0"
      >
        <TopDownGradient
          height={ESTIMATED_MENU_HEIGHT + insets.top}
          startFrom={insets.top}
          color="primary"
          className="absolute inset-0"
        />
        <View className="flex-row items-center justify-between gap-4 p-4">
          <SelectionCount />
          <MultiSelectActions
            presentAddToCreatedPlaylistSheet={() =>
              addToCreatedPlaylistSheetRef.current?.present()
            }
            presentAddToPlaylistsSheet={() =>
              addToPlaylistsSheetRef.current?.present()
            }
          />
        </View>
      </Animated.View>
    </Portal>
  ) : null;
}

//#region Selection Count
function SelectionCount() {
  const { t } = useTranslation();
  const amountSelected = useTrackMultiSelectStore((s) => s.selected.size);

  return (
    <View className="flex-row items-center gap-1 rounded-full bg-surfaceContainerLowest">
      <FilledIconButton
        icon="close"
        accessibilityLabel={t("form.close")}
        onPress={TrackMultiSelect.reset}
        size="xs"
        _iconColor="error"
      />
      <StyledText className="mr-4 text-xs">
        {t("template.countSelected", { count: amountSelected })}
      </StyledText>
    </View>
  );
}
//#endregion

//#region Mutli-Select Actions
function MultiSelectActions(props: {
  presentAddToCreatedPlaylistSheet: VoidFunction;
  presentAddToPlaylistsSheet: VoidFunction;
}) {
  const { t } = useTranslation();
  const availableRoutes = useNavigationState((s) => s.routes);
  const amountSelected = useTrackMultiSelectStore((s) => s.selected.size);
  const isAllFavorited = useTrackMultiSelectStore((s) => s.isAllFavorited);

  const isPlaylistRoute = useMemo(
    () => availableRoutes.at(-1)?.key.startsWith("Playlist-"),
    [availableRoutes],
  );
  const playlistRouteId = useMemo(
    // @ts-expect-error - Should be fine.
    () => String(availableRoutes.at(-1)?.params?.id),
    [availableRoutes],
  );
  const isFavoriteRoute =
    isPlaylistRoute && playlistRouteId === FavoritesPlaylistKey;

  const trackTerm = t("term.tracks");
  const trackCount = t("plural.track", { count: amountSelected });

  return (
    <View className="flex-row items-center gap-1 rounded-full bg-surfaceContainerLowest">
      {!isFavoriteRoute ? (
        <FilledIconButton
          icon={`favorite${isAllFavorited ? "-filled" : ""}`}
          accessibilityLabel={t("term.favorite")}
          onPress={favoriteSelected}
        />
      ) : null}
      {isPlaylistRoute ? (
        <ConfirmableAction
          Component={FilledIconButton}
          componentProps={{
            icon: "remove",
            accessibilityLabel: t("template.entryRemove", { name: trackTerm }),
            onPress: () => removeSelectedFromPlaylist(playlistRouteId),
          }}
          // @ts-expect-error - If we use a non-translation key, it'll be rendered as a string.
          modalMessage={[t("template.entryRemove", { name: trackCount })]}
        />
      ) : (
        <FilledIconButton
          icon="playlist-add"
          accessibilityLabel={t("feat.modalTrack.extra.addToPlaylist")}
          onPress={props.presentAddToPlaylistsSheet}
        />
      )}
      {!isPlaylistRoute ? (
        <FilledIconButton
          icon="add"
          accessibilityLabel={t("form.create")}
          onPress={props.presentAddToCreatedPlaylistSheet}
        />
      ) : null}
      <ConfirmableAction
        Component={FilledIconButton}
        componentProps={{
          icon: "visibility-off-filled",
          accessibilityLabel: t("template.entryHide", { name: trackTerm }),
          onPress: hideSelected,
        }}
        // @ts-expect-error - If we use a non-translation key, it'll be rendered as a string.
        modalMessage={[t("template.entryHide", { name: trackCount })]}
      />
    </View>
  );
}
//#endregion
//#endregion
