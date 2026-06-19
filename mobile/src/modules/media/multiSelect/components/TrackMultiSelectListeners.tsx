import { useNavigation, useNavigationState } from "@react-navigation/native";
import { Portal } from "@rn-primitives/portal";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, { SlideInUp, SlideOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTrackMultiSelectStore } from "../core/store";
import {
  favoriteSelectedTracks,
  hideSelectedTracks,
  resetTrackMultiSelect,
  toggleSelectedTracksToPlaylist,
} from "../core/actions";

import { clearAllQueries } from "~/lib/react-query";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import { TopDownGradient } from "~/components/Gradient";
import { ConfirmableAction } from "~/components/Modal";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { StyledText } from "~/components/Typography/StyledText";
import { FavoritesPlaylistKey } from "../../constants";
import { AddToPlaylistSheet } from "./AddToPlaylistSheet";
import { AddToCreatedPlaylistSheet } from "./AddToCreatedPlaylistSheet";

export function TrackMultiSelectListeners() {
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener("state", resetTrackMultiSelect);
    return () => unsubscribe();
  }, [navigation]);

  return <TrackMultiSelectMenu />;
}

//#region Selection Menu
const ESTIMATED_MENU_HEIGHT = 100;

export function TrackMultiSelectMenu() {
  const insets = useSafeAreaInsets();
  const isMultiSelectEnabled = useTrackMultiSelectStore((s) => s.enabled);

  return isMultiSelectEnabled ? (
    <Portal name="track-multi-select-menu-portal">
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
          <MultiSelectActions />
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
        onPress={resetTrackMultiSelect}
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
function MultiSelectActions() {
  const { t } = useTranslation();
  const availableRoutes = useNavigationState((s) => s.routes);
  const amountSelected = useTrackMultiSelectStore((s) => s.selected.size);
  const isAllFavorited = useTrackMultiSelectStore((s) => s.isAllFavorited);
  const addToPlaylistSheetRef = useSheetRef();
  const addToCreatedPlaylistSheetRef = useSheetRef();

  const isPlaylistRoute = useMemo(
    () => availableRoutes.at(-1)?.key.startsWith("Playlist-"),
    [availableRoutes],
  );
  const playlistRouteId = useMemo(
    // @ts-expect-error - Should be fine.
    () => String(availableRoutes.at(-1)?.params?.id),
    [availableRoutes],
  );
  const isFavoriteRoute = useMemo(
    () => isPlaylistRoute && playlistRouteId === FavoritesPlaylistKey,
    [isPlaylistRoute, playlistRouteId],
  );

  return (
    <>
      <AddToPlaylistSheet ref={addToPlaylistSheetRef} />
      <AddToCreatedPlaylistSheet ref={addToCreatedPlaylistSheetRef} />
      <View className="flex-row items-center gap-1 rounded-full bg-surfaceContainerLowest">
        {!isFavoriteRoute ? (
          <FilledIconButton
            icon={`favorite${isAllFavorited ? "-filled" : ""}`}
            accessibilityLabel={t("term.favorite")}
            onPress={favoriteSelectedTracks}
          />
        ) : null}
        {isPlaylistRoute ? (
          <FilledIconButton
            icon="remove"
            accessibilityLabel={t("template.entryRemove", {
              name: t("term.tracks"),
            })}
            onPress={() => {
              toggleSelectedTracksToPlaylist(playlistRouteId, true)
                .then(() => clearAllQueries())
                .catch((err) => console.log(err));
              resetTrackMultiSelect();
            }}
          />
        ) : (
          <FilledIconButton
            icon="playlist-add"
            accessibilityLabel={t("feat.modalTrack.extra.addToPlaylist")}
            onPress={() => addToPlaylistSheetRef.current?.present()}
          />
        )}
        {!isPlaylistRoute ? (
          <FilledIconButton
            icon="add"
            accessibilityLabel={t("form.create")}
            onPress={() => addToCreatedPlaylistSheetRef.current?.present()}
          />
        ) : null}
        <ConfirmableAction
          Component={FilledIconButton}
          componentProps={{
            icon: "visibility-off-filled",
            accessibilityLabel: t("template.entryHide", {
              name: t("term.tracks"),
            }),
            onPress: hideSelectedTracks,
          }}
          modalMessage={[
            // @ts-expect-error - If we use a non-translation key, it'll be rendered as a string.
            t("template.entryHide", {
              name: t("plural.track", { count: amountSelected }),
            }),
          ]}
        />
      </View>
    </>
  );
}
//#endregion
//#endregion
