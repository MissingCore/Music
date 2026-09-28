// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { scheduleOnRN } from "react-native-worklets";
import { useShallow } from "zustand/react/shallow";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";
import { MinAlbumLengthConfig } from "~/stores/Preference/utils";
import { sessionStore, useSessionStore } from "~/stores/Session/store";
import { useViewPreferenceStore } from "~/stores/ViewPreference/store";
import {
  ViewPreferenceSetters,
  ViewPreferenceTogglers,
} from "~/stores/ViewPreference/actions";
import {
  LayoutOptions,
  SortOptions,
  SortOptionTranslation,
} from "~/stores/ViewPreference/constants";
import type {
  MutableViewLayout,
  MutableViewOrder,
} from "~/stores/ViewPreference/types";

import { DetachedSheet } from "~/components/Sheet";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { TText } from "~/components/next/base/typography";
import { SegmentedPicker } from "~/components/next/blocks/segmented-picker";
import type { LabeledSliderProps } from "~/components/next/blocks/slider-labeled";
import { LabeledSlider } from "~/components/next/blocks/slider-labeled";

//#region Albums
const AlbumClassification = ["singles", "eps", "albums"] as const;
const AlbumClassificationMap = {
  singles: "showSingles",
  eps: "showEPs",
  albums: "showAlbums",
} as const;

export function AlbumsViewOptionsSheet(props: { ref: TrueSheetRef }) {
  const { t } = useTranslation();
  const minAlbumLength = usePreferenceStore((s) => s.minAlbumLength);
  const visibleContentTypes = useSessionStore(
    useShallow((s) => ({
      singles: s.showSingles,
      eps: s.showEPs,
      albums: s.showAlbums,
    })),
  );
  const [stopDrag, setStopDrag] = useState(false);

  const pickerOptions = AlbumClassification.map((option) => ({
    label: t(`term.${option}`),
    value: option,
  }));
  const selectedOptions = Object.entries(visibleContentTypes)
    .map(([key, enabled]) =>
      enabled ? (key as (typeof AlbumClassification)[number]) : undefined,
    )
    .filter((key) => key !== undefined);

  const minAlbumSliderOptions = useMemo<Omit<LabeledSliderProps, "initValue">>(
    () => ({
      ...MinAlbumLengthConfig.bound,
      label: t("feat.minAlbumLength.title"),
      formatValue: (value) => {
        "worklet";
        return String(value);
      },
      onChange: (value) => {
        "worklet";
        scheduleOnRN(PreferenceSetters.setMinAlbumLength, value);
      },
      onStatusChange: (status) => {
        "worklet";
        scheduleOnRN(setStopDrag, status !== "idle");
      },
    }),
    [t],
  );

  return (
    <DetachedSheet ref={props.ref} draggable={!stopDrag}>
      <ScreenLayoutSetting screen="album" />
      <SegmentedPicker
        type="checkbox"
        options={pickerOptions}
        selected={selectedOptions}
        onSelect={(value) => {
          const key = AlbumClassificationMap[value];
          sessionStore.setState((prev) => ({ [key]: !prev[key] }));
        }}
      />
      <LabeledSlider initValue={minAlbumLength} {...minAlbumSliderOptions} />
      <SortOptionSetting screen="album" />
    </DetachedSheet>
  );
}
//#endregion

//#region Artists
export function ArtistsViewOptionsSheet(props: { ref: TrueSheetRef }) {
  return <ViewOptionsSheetTemplate ref={props.ref} screen="artist" />;
}
//#endregion

//#region Folders
export function FoldersViewOptionsSheet(props: { ref: TrueSheetRef }) {
  return (
    <DetachedSheet ref={props.ref}>
      <SortOptionSetting screen="folder" />
    </DetachedSheet>
  );
}
//#endregion

//#region Genres
export function GenresViewOptionsSheet(props: { ref: TrueSheetRef }) {
  return <ViewOptionsSheetTemplate ref={props.ref} screen="genre" />;
}
//#endregion

//#region Playlists
export function PlaylistsViewOptionsSheet(props: { ref: TrueSheetRef }) {
  return <ViewOptionsSheetTemplate ref={props.ref} screen="playlist" />;
}
//#endregion

//#region Tracks
export function TracksViewOptionsSheet(props: { ref: TrueSheetRef }) {
  return (
    <DetachedSheet ref={props.ref}>
      <SortOptionSetting screen="track" />
    </DetachedSheet>
  );
}
//#endregion

//#region Sheet Template
function ViewOptionsSheetTemplate(props: {
  ref: TrueSheetRef;
  screen: MutableViewLayout;
}) {
  return (
    <DetachedSheet ref={props.ref}>
      <ScreenLayoutSetting screen={props.screen} />
      <SortOptionSetting screen={props.screen} />
    </DetachedSheet>
  );
}
//#endregion

//#region Screen Layout
function ScreenLayoutSetting({ screen }: { screen: MutableViewLayout }) {
  const { t } = useTranslation();
  const layoutOption = useViewPreferenceStore((s) => s[`${screen}Layout`]);

  const pickerOptions = LayoutOptions.map((option) => ({
    label: t(`feat.modalViewPreference.extra.${option}`),
    value: option,
  }));

  return (
    <SegmentedPicker
      type="radio"
      accessibilityLabel={t("feat.modalViewPreference.extra.layout")}
      options={pickerOptions}
      selected={layoutOption}
      onSelect={(value) => ViewPreferenceSetters.setLayout(screen, value)}
    />
  );
}
//#endregion

//#region Sort Options
function SortOptionSetting({ screen }: { screen: MutableViewOrder }) {
  const { t } = useTranslation();
  const isAsc = useViewPreferenceStore((s) => s[`${screen}IsAsc`]);
  const orderedBy = useViewPreferenceStore((s) => s[`${screen}Order`]);

  const pickerOptions = SortOptions[screen].map((option) => ({
    label: t(SortOptionTranslation[option]),
    value: option,
  }));

  return (
    <>
      <TText
        textKey="feat.modalViewPreference.extra.sort"
        intent="em"
        className="-mb-4"
      />
      <SegmentedPicker
        type="radio"
        accessibilityLabel={t("feat.modalViewPreference.extra.sort")}
        options={pickerOptions}
        selected={orderedBy}
        onSelect={(value) => ViewPreferenceSetters.setSortOrder(screen, value)}
        reselect={{
          cb: () => ViewPreferenceTogglers.toggleIsAsc(screen),
          icon: isAsc ? "arrow-up-narrow-wide" : "arrow-down-wide-narrow",
        }}
      />
    </>
  );
}
//#endregion
