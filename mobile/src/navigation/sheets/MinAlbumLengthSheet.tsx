import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";

import { DetachedNumericSheet } from "~/components/Sheet/DetachedNumeric";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";

/** @deprecated We plan on integrating this setting in a different sheet. */
export function MinAlbumLengthSheet(props: { ref: TrueSheetRef }) {
  const minAlbumLength = usePreferenceStore((s) => s.minAlbumLength);
  return (
    <DetachedNumericSheet
      ref={props.ref}
      titleKey="feat.minAlbumLength.title"
      valueLabelKey="plural.track_other"
      value={minAlbumLength}
      setValue={PreferenceSetters.setMinAlbumLength}
    />
  );
}
