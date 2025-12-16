import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";

import { FlatList } from "~/components/Defaults";
import { Radio } from "~/components/Form/Selection";
import type { TrueSheetRef } from "~/components/Sheet";
import { NumericSheet, Sheet } from "~/components/Sheet";
import { TStyledText } from "~/components/Typography/StyledText";
import { NowPlayingDesignOptions } from "~/stores/Preference/constants";
import { deferInitialRender } from "../../../components/DeferredRender";

/** All the sheets used on `/setting/appearance` route. */
export const AppearanceSettingsSheets = deferInitialRender(
  function AppearanceSettingsSheets(props: {
    albumLengthFilterRef: TrueSheetRef;
    nowPlayingDesignRef: TrueSheetRef;
  }) {
    return (
      <>
        <MinAlbumLengthSheet sheetRef={props.albumLengthFilterRef} />
        <NowPlayingDesignSheet sheetRef={props.nowPlayingDesignRef} />
      </>
    );
  },
);

//#region Min Album Length
/**
 * Enables us to specify the minimum number of tracks required for an
 * album to be displayed in the Albums screen.
 */
function MinAlbumLengthSheet(props: { sheetRef: TrueSheetRef }) {
  const minAlbumLength = usePreferenceStore((s) => s.minAlbumLength);
  return (
    <NumericSheet
      sheetRef={props.sheetRef}
      titleKey="feat.albumLengthFilter.title"
      descriptionKey="feat.albumLengthFilter.description"
      value={minAlbumLength}
      setValue={PreferenceSetters.setMinAlbumLength}
    />
  );
}
//#endregion

//#region Now Playing Design
/** Enables changing the appearance of the artwork on the "Now Playing" screen. */
function NowPlayingDesignSheet(props: { sheetRef: TrueSheetRef }) {
  const nowPlayingDesign = usePreferenceStore((s) => s.nowPlayingDesign);
  return (
    <Sheet ref={props.sheetRef} titleKey="feat.nowPlayingDesign.title">
      <FlatList
        accessibilityRole="radiogroup"
        data={NowPlayingDesignOptions}
        keyExtractor={(design) => design}
        renderItem={({ item: design }) => (
          <Radio
            selected={nowPlayingDesign === design}
            onSelect={() => PreferenceSetters.setNowPlayingDesign(design)}
          >
            <TStyledText textKey={`feat.nowPlayingDesign.extra.${design}`} />
          </Radio>
        )}
        contentContainerClassName="gap-1"
      />
    </Sheet>
  );
}
//#endregion
