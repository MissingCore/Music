// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useTranslation } from "react-i18next";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";

import { ScrollLayout } from "~/navigation/layouts/ScrollLayout";
import { ColumnSizeSheet } from "./sheets/ColumnSizeSheet";
import {
  DefaultLibraryTabSheet,
  DefaultOpenTabSheet,
} from "./sheets/TabSelectionSheets";

import { useSheetRef } from "~/components/next/base/sheet";
import * as List from "~/components/next/composed/list";
import {
  AccentFontSheet,
  PrimaryFontSheet,
} from "~/modules/customization/font/sheet";
import { ThemeSheet } from "~/modules/customization/theme/sheet";
import { getFontDisplayName } from "~/modules/customization/font/utils";

export default function AppearanceSettings() {
  const { t } = useTranslation();
  const accentFont = usePreferenceStore((s) => s.accentFont);
  const primaryFont = usePreferenceStore((s) => s.primaryFont);
  const theme = usePreferenceStore((s) => s.theme);
  const activeCustomTheme = usePreferenceStore((s) => s.activeCustomTheme);
  const defaultOpenTab = usePreferenceStore((s) => s.defaultOpenTab);
  const defaultLibraryTab = usePreferenceStore((s) => s.defaultLibraryTab);
  const dragClearPlayback = usePreferenceStore((s) => s.dragClearPlayback);
  const miniplayerGestures = usePreferenceStore((s) => s.miniplayerGestures);
  const nowPlayingArtworkControls = usePreferenceStore(
    (s) => s.nowPlayingArtworkControls,
  );
  const nowPlayingGestures = usePreferenceStore((s) => s.nowPlayingGestures);
  const quickAddQueue = usePreferenceStore((s) => s.quickAddQueue);
  const quickFavorite = usePreferenceStore((s) => s.quickFavorite);
  const squareArtwork = usePreferenceStore((s) => s.squareArtwork);
  const accentFontSheetRef = useSheetRef();
  const primaryFontSheetRef = useSheetRef();
  const themeSheetRef = useSheetRef();
  const columnSizeSheetRef = useSheetRef();
  const defaultOpenTabSheetRef = useSheetRef();
  const defaultLibraryTabSheetRef = useSheetRef();

  return (
    <>
      <AccentFontSheet ref={accentFontSheetRef} />
      <PrimaryFontSheet ref={primaryFontSheetRef} />
      <ThemeSheet ref={themeSheetRef} />
      <ColumnSizeSheet ref={columnSizeSheetRef} />
      <DefaultOpenTabSheet ref={defaultOpenTabSheetRef} />
      <DefaultLibraryTabSheet ref={defaultLibraryTabSheetRef} />

      <ScrollLayout title="feat.appearance.title">
        <List.Group label={t("feat.theme.title")}>
          <List.Item
            icon="brand-family"
            label={t("feat.font.extra.accent")}
            supporting={getFontDisplayName(accentFont)}
            onPress={() => accentFontSheetRef.current?.present()}
          />
          <List.Divider />
          <List.Item
            icon="match-case"
            label={t("feat.font.extra.primary")}
            supporting={getFontDisplayName(primaryFont)}
            onPress={() => primaryFontSheetRef.current?.present()}
          />
          <List.Divider />
          <List.Item
            icon="routine"
            label={t("feat.theme.title")}
            supporting={
              activeCustomTheme?.name ?? t(`feat.theme.extra.${theme}`)
            }
            onPress={() => themeSheetRef.current?.present()}
          />
        </List.Group>

        <List.Group label={t("feat.homeScreens.title")}>
          <List.Item
            icon="widget-width"
            label={t("feat.modalViewPreference.extra.columnSize")}
            onPress={() => columnSizeSheetRef.current?.present()}
          />
          <List.Divider />
          <List.Item
            icon="home"
            label={t("feat.homeScreens.extra.defaultOpenTab")}
            supporting={t(`term.${defaultOpenTab}`)}
            onPress={() => defaultOpenTabSheetRef.current?.present()}
          />
          <List.Divider />
          <List.Item
            icon="library-music"
            label={t("feat.homeScreens.extra.defaultLibraryTab")}
            supporting={t(`term.${defaultLibraryTab}s`)}
            onPress={() => defaultLibraryTabSheetRef.current?.present()}
          />
        </List.Group>

        <List.Group label={t("feat.miniplayer.title")}>
          <List.ToggleItem
            icon="swipe-down"
            label={t("feat.miniplayer.extra.dragToDismiss")}
            onToggle={PreferenceTogglers.toggleKey("dragClearPlayback")}
            enabled={dragClearPlayback}
          />
          <List.Divider />
          <List.ToggleItem
            icon="swipe"
            label={t("feat.miniplayer.extra.swipeControls")}
            onToggle={PreferenceTogglers.toggleKey("miniplayerGestures")}
            enabled={miniplayerGestures}
          />
        </List.Group>

        <List.Group label={t("feat.nowPlaying.title")}>
          <List.ToggleItem
            icon="image"
            label={t("feat.nowPlaying.extra.artworkPlaybackToggle")}
            onToggle={PreferenceTogglers.toggleKey("nowPlayingArtworkControls")}
            enabled={nowPlayingArtworkControls}
          />
          <List.Divider />
          <List.ToggleItem
            icon="swipe"
            label={t("feat.miniplayer.extra.swipeControls")}
            onToggle={PreferenceTogglers.toggleKey("nowPlayingGestures")}
            enabled={nowPlayingGestures}
          />
        </List.Group>

        <List.Group label={t("feat.modalTrack.extra.trackQuickActions")}>
          <List.ToggleItem
            icon="queue-music"
            label={t("feat.queue.extra.add")}
            onToggle={PreferenceTogglers.toggleKey("quickAddQueue")}
            enabled={quickAddQueue}
          />
          <List.Divider />
          <List.ToggleItem
            icon="favorite"
            label={t("term.favorite")}
            onToggle={PreferenceTogglers.toggleKey("quickFavorite")}
            enabled={quickFavorite}
          />
        </List.Group>

        <List.Group label={t("term.misc")}>
          <List.ToggleItem
            icon="image"
            label={t("feat.artwork.extra.square")}
            onToggle={PreferenceTogglers.toggleKey("squareArtwork")}
            enabled={squareArtwork}
          />
        </List.Group>
      </ScrollLayout>
    </>
  );
}
