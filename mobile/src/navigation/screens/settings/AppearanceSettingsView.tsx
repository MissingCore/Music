// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useTranslation } from "react-i18next";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";

import { ListLayout } from "~/navigation/layouts/ListLayout";
import { ColumnSizeSheet } from "./sheets/ColumnSizeSheet";
import { TabOrderSheet } from "./sheets/TabOrderSheet";
import * as SettingsList from "./components/SettingsList";

import { useSheetRef } from "~/components/next/base/sheet";
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
  const showNavbar = usePreferenceStore((s) => s.showNavbar);
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
  const tabOrderSheetRef = useSheetRef();

  return (
    <>
      <AccentFontSheet ref={accentFontSheetRef} />
      <PrimaryFontSheet ref={primaryFontSheetRef} />
      <ThemeSheet ref={themeSheetRef} />
      <ColumnSizeSheet ref={columnSizeSheetRef} />
      <TabOrderSheet ref={tabOrderSheetRef} />

      <ListLayout>
        <SettingsList.Group label={t("feat.theme.title")}>
          <SettingsList.Item
            icon="brand-family"
            label={t("feat.font.extra.accent")}
            supporting={getFontDisplayName(accentFont)}
            onPress={() => accentFontSheetRef.current?.present()}
          />
          <SettingsList.Divider />
          <SettingsList.Item
            icon="match-case"
            label={t("feat.font.extra.primary")}
            supporting={getFontDisplayName(primaryFont)}
            onPress={() => primaryFontSheetRef.current?.present()}
          />
          <SettingsList.Divider />
          <SettingsList.Item
            icon="routine"
            label={t("feat.theme.title")}
            supporting={
              activeCustomTheme?.name ?? t(`feat.theme.extra.${theme}`)
            }
            onPress={() => themeSheetRef.current?.present()}
          />
        </SettingsList.Group>

        <SettingsList.Group label={t("term.homeScreens")}>
          <SettingsList.Item
            icon="widget-width"
            label={t("feat.modalViewPreference.extra.columnSize")}
            onPress={() => columnSizeSheetRef.current?.present()}
          />
          <SettingsList.Divider />
          <SettingsList.Item
            icon="tab-move"
            label={t("feat.tabsOrder.title")}
            supporting={t("feat.tabsOrder.brief")}
            onPress={() => tabOrderSheetRef.current?.present()}
          />
          <SettingsList.Divider />
          <SettingsList.ToggleItem
            icon="bottom-navigation"
            label={t("feat.tabsOrder.extra.showNavbar")}
            onToggle={PreferenceTogglers.toggleKey("showNavbar")}
            enabled={showNavbar}
          />
        </SettingsList.Group>

        <SettingsList.Group label={t("feat.miniplayer.title")}>
          <SettingsList.ToggleItem
            icon="swipe-down"
            label={t("feat.miniplayer.extra.dragToDismiss")}
            onToggle={PreferenceTogglers.toggleKey("dragClearPlayback")}
            enabled={dragClearPlayback}
          />
          <SettingsList.Divider />
          <SettingsList.ToggleItem
            icon="swipe"
            label={t("feat.miniplayer.extra.swipeControls")}
            onToggle={PreferenceTogglers.toggleKey("miniplayerGestures")}
            enabled={miniplayerGestures}
          />
        </SettingsList.Group>

        <SettingsList.Group label={t("feat.nowPlaying.title")}>
          <SettingsList.ToggleItem
            icon="image"
            label={t("feat.nowPlaying.extra.artworkPlaybackToggle")}
            onToggle={PreferenceTogglers.toggleKey("nowPlayingArtworkControls")}
            enabled={nowPlayingArtworkControls}
          />
          <SettingsList.Divider />
          <SettingsList.ToggleItem
            icon="swipe"
            label={t("feat.miniplayer.extra.swipeControls")}
            onToggle={PreferenceTogglers.toggleKey("nowPlayingGestures")}
            enabled={nowPlayingGestures}
          />
        </SettingsList.Group>

        <SettingsList.Group
          label={t("feat.modalTrack.extra.trackQuickActions")}
        >
          <SettingsList.ToggleItem
            icon="queue-music"
            label={t("feat.queue.extra.add")}
            onToggle={PreferenceTogglers.toggleKey("quickAddQueue")}
            enabled={quickAddQueue}
          />
          <SettingsList.Divider />
          <SettingsList.ToggleItem
            icon="favorite"
            label={t("term.favorite")}
            onToggle={PreferenceTogglers.toggleKey("quickFavorite")}
            enabled={quickFavorite}
          />
        </SettingsList.Group>

        <SettingsList.Group label={t("term.misc")}>
          <SettingsList.ToggleItem
            icon="image"
            label={t("feat.artwork.extra.square")}
            onToggle={PreferenceTogglers.toggleKey("squareArtwork")}
            enabled={squareArtwork}
          />
        </SettingsList.Group>
      </ListLayout>
    </>
  );
}
