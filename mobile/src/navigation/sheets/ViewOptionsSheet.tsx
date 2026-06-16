import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Icon } from "~/resources/icons";
import { GridView } from "~/resources/icons/GridView";
import { ViewAgenda } from "~/resources/icons/ViewAgenda";
import { ViewModule } from "~/resources/icons/ViewModule";
import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";
import { useViewPreferenceStore } from "~/stores/ViewPreference/store";
import { ViewPreferenceSetters } from "~/stores/ViewPreference/actions";

import { SortSheet } from "~/navigation/sheets/SortSheet";

import { FilledIconButton } from "~/components/Form/Button/Icon";
import { NumberStepper } from "~/components/Form/NumberStepper";
import { SegmentedList } from "~/components/List/Segmented";
import { DetachedSheet } from "~/components/Sheet";
import { SheetLabelAction } from "~/components/Sheet/SheetLabelAction";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { LayoutOptions } from "~/stores/ViewPreference/constants";
import type { MutableViewLayout } from "~/stores/ViewPreference/types";

//#region Albums
export function AlbumsViewOptionsSheet(props: { ref: TrueSheetRef }) {
  const minAlbumLength = usePreferenceStore((s) => s.minAlbumLength);
  const sortOrderSheetRef = useSheetRef();

  return (
    <>
      <DetachedSheet ref={props.ref}>
        <ScreenLayoutSetting screen="album" />
        <SheetLabelAction
          labelKey="feat.minAlbumLength.title"
          RightElement={
            <NumberStepper
              value={minAlbumLength}
              onChange={PreferenceSetters.updateMinAlbumLengthByDelta}
              min={1}
              max={20}
            />
          }
        />

        <SegmentedList.Item
          labelTextKey="feat.modalViewPreference.extra.sort"
          onPress={() => {
            props.ref.current?.dismiss();
            sortOrderSheetRef.current?.present();
          }}
          LeftElement={<Icon name="sort" />}
          className="gap-4"
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
          labelTextKey="feat.modalViewPreference.extra.sort"
          onPress={() => {
            props.ref.current?.dismiss();
            sortOrderSheetRef.current?.present();
          }}
          LeftElement={<Icon name="sort" />}
          className="gap-4"
        />
      </DetachedSheet>
      <SortSheet ref={sortOrderSheetRef} screen={props.screen} />
    </>
  );
}
//#endregion

//#region Screen Layout
const LayoutIconMap = {
  list: ViewAgenda,
  grid: GridView,
  compactGrid: ViewModule,
} as const;

function ScreenLayoutSetting({ screen }: { screen: MutableViewLayout }) {
  const { t } = useTranslation();
  const layoutOption = useViewPreferenceStore((s) => s[`${screen}Layout`]);

  return (
    <SheetLabelAction
      labelKey="feat.modalViewPreference.extra.layout"
      RightElement={
        <View className="flex-row gap-2 rounded-full bg-surfaceContainerLowest">
          {LayoutOptions.map((layout) => (
            <FilledIconButton
              key={layout}
              Icon={LayoutIconMap[layout]}
              accessibilityLabel={t(`feat.modalViewPreference.extra.${layout}`)}
              onPress={() => ViewPreferenceSetters.setLayout(screen, layout)}
              _iconColor={layoutOption === layout ? "primary" : undefined}
              size="xs"
            />
          ))}
        </View>
      }
    />
  );
}
//#endregion
