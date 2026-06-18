import { toast } from "@missingcore/ui/toast";
import { useNavigation, useNavigationState } from "@react-navigation/native";
import { Portal } from "@rn-primitives/portal";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Animated, { SlideInUp, SlideOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePlaylistsNames } from "~/data/playlist/queries";
import { useTrackMultiSelectStore } from "../core/store";
import {
  favoriteSelectedTracks,
  hideSelectedTracks,
  resetTrackMultiSelect,
  toggleSelectedTracksToPlaylist,
} from "../core/actions";

import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import { clearAllQueries } from "~/lib/react-query";
import { wait } from "~/utils/promise";
import { FlatList } from "~/components/Base/List";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import { CheckboxField } from "~/components/Form/Checkbox";
import { TopDownGradient } from "~/components/Gradient";
import { Marquee } from "~/components/Marquee";
import { ConfirmableAction } from "~/components/Modal";
import { DetachedSheet } from "~/components/Sheet";
import { useEnableSheetScroll } from "~/components/Sheet/useEnableSheetScroll";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { StyledText } from "~/components/Typography/StyledText";
import { FavoritesPlaylistKey } from "../../constants";

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
          <MutliSelectActions />
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
function MutliSelectActions() {
  const { t } = useTranslation();
  const availableRoutes = useNavigationState((s) => s.routes);
  const amountSelected = useTrackMultiSelectStore((s) => s.selected.size);
  const isAllFavorited = useTrackMultiSelectStore((s) => s.isAllFavorited);
  const playlistsSheetRef = useSheetRef();

  const isPlaylistRoute = useMemo(
    () => availableRoutes.at(-1)?.key.startsWith("Playlist-"),
    [availableRoutes],
  );
  const isFavoriteRoute = useMemo(
    () =>
      isPlaylistRoute &&
      // @ts-expect-error - Should be fine.
      String(availableRoutes.at(-1)?.params?.id) === FavoritesPlaylistKey,
    [availableRoutes, isPlaylistRoute],
  );

  return (
    <>
      <TracksToPlaylistSheet ref={playlistsSheetRef} />
      <View className="flex-row items-center gap-1 rounded-full bg-surfaceContainerLowest">
        {!isFavoriteRoute ? (
          <FilledIconButton
            icon={`favorite${isAllFavorited ? "-filled" : ""}`}
            accessibilityLabel={t("term.favorite")}
            onPress={favoriteSelectedTracks}
          />
        ) : null}
        {isPlaylistRoute ? null : (
          <FilledIconButton
            icon="playlist-add"
            accessibilityLabel={t("feat.modalTrack.extra.addToPlaylist")}
            onPress={() => playlistsSheetRef.current?.present()}
          />
        )}
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

function TracksToPlaylistSheet(props: { ref: TrueSheetRef }) {
  const { data: playlistsNames } = usePlaylistsNames();
  const amountSelected = useTrackMultiSelectStore((s) => s.selected.size);
  const [inLists, setInLists] = useState(new Set<string>());
  const sheetListHandlers = useEnableSheetScroll();

  // Reset selection whenever the number of items of selected items change.
  useEffect(() => {
    setInLists(new Set());
  }, [amountSelected]);

  return (
    <DetachedSheet
      ref={props.ref}
      titleKey="feat.modalTrack.extra.addToPlaylist"
      onCleanup={async () => {
        resetTrackMultiSelect();
        await wait(1);
        clearAllQueries();
      }}
      snapTop
    >
      <FlatList
        data={playlistsNames}
        keyExtractor={(name) => name}
        renderItem={({ item: name }) => {
          const selected = inLists.has(name);
          return (
            <CheckboxField
              checked={selected}
              onCheck={async () => {
                try {
                  await toggleSelectedTracksToPlaylist(name, selected);
                  setInLists((prev) => {
                    const updatedList = new Set(prev);
                    if (selected) updatedList.delete(name);
                    else updatedList.add(name);
                    return updatedList;
                  });
                } catch (err) {
                  console.log(err);
                  toast.tError("err.flow.generic.title");
                }
              }}
              className="mb-2"
            >
              <Marquee color="surfaceBright">
                <StyledText>{name}</StyledText>
              </Marquee>
            </CheckboxField>
          );
        }}
        getItemLayout={getItemLayout}
        ListEmptyComponent={
          <ContentPlaceholder errMsgKey="err.msg.noPlaylists" />
        }
        {...sheetListHandlers}
        className="-mb-2"
        contentContainerClassName="pb-4"
      />
    </DetachedSheet>
  );
}

function getItemLayout(_: unknown, index: number) {
  // 54px Height + 8px Margin Bottom
  return { length: 62, offset: 62 * index, index };
}
//#endregion
//#endregion
