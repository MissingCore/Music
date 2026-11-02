// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";
import { useNavigation, useNavigationState } from "@react-navigation/native";
import { Portal } from "@rn-primitives/portal";
import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, { SlideInUp, SlideOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useBackHandler } from "~/hooks/useBackHandler";
import { TrackMultiSelect, useTrackMultiSelectStore } from "./core/store";
import {
  favoriteSelected,
  hideSelected,
  removeSelectedFromPlaylist,
  updateTracksInPlaylist,
} from "./core/actions";

import { TopDownGradient } from "~/components/Gradient";
import { IconButton } from "~/components/next/base/button-icon";
import type { SheetRef } from "~/components/next/base/sheet";
import { useSheetRef } from "~/components/next/base/sheet";
import { Text } from "~/components/next/base/typography";
import { ConfirmAction } from "~/components/next/composed/confirm-action";
import { AddToPlaylistsSheetBase } from "../components/AddToPlaylistsSheetBase";
import { FavoritesPlaylistKey } from "../constants";

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
  const addToPlaylistsSheetRef = useSheetRef();

  // Close multi-select menu when a "back" action is detected. If there
  // are multiple `BackHandler` listeners on the given screen, this should
  // fire first due to being created last.
  useBackHandler(
    () => {
      TrackMultiSelect.reset();
      return true;
    },
    [],
    isMultiSelectEnabled,
  );

  return isMultiSelectEnabled ? (
    <Portal name="track-multi-select-menu-portal">
      <AddToPlaylistsSheet ref={addToPlaylistsSheetRef} />

      <Animated.View
        entering={SlideInUp}
        exiting={SlideOutUp}
        className="absolute top-0 right-0 left-0 pt-safe"
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
            presentAddToPlaylistsSheet={() =>
              addToPlaylistsSheetRef.current?.present()
            }
          />
        </View>
      </Animated.View>
    </Portal>
  ) : null;
}

//#region AddToPlaylist Sheet
function AddToPlaylistsSheet(props: { ref: SheetRef }) {
  const toggleInPlaylist = useCallback(
    async (playlistName: string, remove = false) => {
      const status = await updateTracksInPlaylist({ playlistName, remove });
      if (status !== "success") {
        if (status === "error") toast.tError("err.flow.generic.title");
        throw new Error("Skip selection handling...");
      }
    },
    [],
  );
  return (
    <AddToPlaylistsSheetBase
      ref={props.ref}
      onToggleInPlaylist={toggleInPlaylist}
      onResolve={() => TrackMultiSelect.reset()}
    />
  );
}
//#endregion

//#region Selection Count
function SelectionCount() {
  const { t } = useTranslation();
  const amountSelected = useTrackMultiSelectStore((s) => s.selected.size);

  return (
    <View className="flex-row items-center gap-1 rounded-full bg-surfaceContainerLowest">
      <IconButton
        icon="close"
        accessibilityLabel={t("form.close")}
        onPress={TrackMultiSelect.reset}
        size="xs"
        _iconColor="error"
      />
      <Text size="xs" className="mr-4">
        {t("template.countSelected", { count: amountSelected })}
      </Text>
    </View>
  );
}
//#endregion

//#region Mutli-Select Actions
function MultiSelectActions(props: {
  presentAddToPlaylistsSheet: VoidFunction;
}) {
  const { t } = useTranslation();
  const mostRecentRoute = useNavigationState((s) => s.routes[s.index]);
  const amountSelected = useTrackMultiSelectStore((s) => s.selected.size);
  const isAllFavorited = useTrackMultiSelectStore((s) => s.isAllFavorited);

  const isPlaylistRoute = mostRecentRoute?.key.startsWith("Playlist-");
  // @ts-expect-error - Should be fine.
  const playlistRouteId = String(mostRecentRoute?.params?.id);
  const isFavoriteRoute =
    isPlaylistRoute && playlistRouteId === FavoritesPlaylistKey;

  const trackTerm = t("term.tracks");
  const trackCount = t("plural.track", { count: amountSelected });

  return (
    <View className="flex-row items-center gap-1 rounded-full bg-surfaceContainerLowest">
      {!isFavoriteRoute ? (
        <IconButton
          icon={`favorite${isAllFavorited ? "-filled" : ""}`}
          accessibilityLabel={t("term.favorite")}
          onPress={favoriteSelected}
        />
      ) : null}
      {isPlaylistRoute ? (
        <ConfirmAction
          prompt={[t("template.entryRemove", { name: trackCount })]}
        >
          <IconButton
            icon="remove"
            accessibilityLabel={t("template.entryRemove", { name: trackTerm })}
            onPress={() => removeSelectedFromPlaylist(playlistRouteId)}
          />
        </ConfirmAction>
      ) : (
        <IconButton
          icon="playlist-add"
          accessibilityLabel={t("feat.modalTrack.extra.addToPlaylist")}
          onPress={props.presentAddToPlaylistsSheet}
        />
      )}
      <ConfirmAction prompt={[t("template.entryHide", { name: trackCount })]}>
        <IconButton
          icon="visibility-off-filled"
          accessibilityLabel={t("template.entryHide", { name: trackTerm })}
          onPress={hideSelected}
        />
      </ConfirmAction>
    </View>
  );
}
//#endregion
//#endregion
