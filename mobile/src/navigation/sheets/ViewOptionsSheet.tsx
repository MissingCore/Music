// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";

import { Icon } from "~/resources/icons";
import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";
import { MinAlbumLengthConfig } from "~/stores/Preference/utils";
import { sessionStore, useSessionStore } from "~/stores/Session/store";
import { useViewPreferenceStore } from "~/stores/ViewPreference/store";
import { ViewPreferenceSetters } from "~/stores/ViewPreference/actions";
import { LayoutOptions } from "~/stores/ViewPreference/constants";
import type { MutableViewLayout } from "~/stores/ViewPreference/types";

import { SortSheet } from "~/navigation/sheets/SortSheet";

import { NumberStepper } from "~/components/Form/NumberStepper";
import { SegmentedList } from "~/components/List/Segmented";
import { DetachedSheet } from "~/components/Sheet";
import { SheetLabelAction } from "~/components/Sheet/SheetLabelAction";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { SegmentedPicker } from "~/components/next/blocks/segmented-picker";

//#region Albums
const albumScreenContentTypes = [
  { label: "Singles", value: "singles" },
  { label: "EPs", value: "eps" },
  { label: "Albums", value: "albums" },
] as const;

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
  const sortOrderSheetRef = useSheetRef();

  const pickerOptions = albumScreenContentTypes.map((option) => ({
    label: t(`term.${option.value}`),
    value: option,
    selected: visibleContentTypes[option.value],
  }));

  return (
    <>
      <DetachedSheet ref={props.ref}>
        <ScreenLayoutSetting screen="album" />
        <SegmentedPicker
          type="checkbox"
          options={pickerOptions}
          onSelected={(value) => {
            const key = `show${value.label}` as const;
            sessionStore.setState((prev) => ({ [key]: !prev[key] }));
          }}
        />

        <SheetLabelAction
          labelKey="feat.minAlbumLength.title"
          Trailing={
            <NumberStepper
              value={minAlbumLength}
              onChange={PreferenceSetters.updateMinAlbumLengthByDelta}
              {...MinAlbumLengthConfig.bound}
            />
          }
        />

        <SegmentedList.Item
          labelText="feat.modalViewPreference.extra.sort"
          onPress={() => {
            props.ref.current?.dismiss();
            sortOrderSheetRef.current?.present();
          }}
          Leading={<Icon name="sort" />}
        />
      </DetachedSheet>
      <SortSheet ref={sortOrderSheetRef} screen="album" />
    </>
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
  return <SortSheet ref={props.ref} screen="folder" />;
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
  return <SortSheet ref={props.ref} screen="track" />;
}
//#endregion

//#region Sheet Template
function ViewOptionsSheetTemplate(props: {
  ref: TrueSheetRef;
  screen: MutableViewLayout;
}) {
  const sortOrderSheetRef = useSheetRef();
  return (
    <>
      <DetachedSheet ref={props.ref}>
        <ScreenLayoutSetting screen={props.screen} />
        <SegmentedList.Item
          labelText="feat.modalViewPreference.extra.sort"
          onPress={() => {
            props.ref.current?.dismiss();
            sortOrderSheetRef.current?.present();
          }}
          Leading={<Icon name="sort" />}
        />
      </DetachedSheet>
      <SortSheet ref={sortOrderSheetRef} screen={props.screen} />
    </>
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
    selected: layoutOption === option,
  }));

  return (
    <SegmentedPicker
      type="radio"
      accessibilityLabel={t("feat.modalViewPreference.extra.layout")}
      options={pickerOptions}
      onSelected={(value) => ViewPreferenceSetters.setLayout(screen, value)}
    />
  );
}
//#endregion
