import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";

import { DetachedNumericSheet } from "~/components/Sheet/DetachedNumeric";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";

/** @deprecated We plan on integrating this setting in a different sheet. */
export function PlaybackDelaySheet(props: { ref: TrueSheetRef }) {
  const playbackDelay = usePreferenceStore((s) => s.playbackDelay);
  return (
    <DetachedNumericSheet
      ref={props.ref}
      titleKey="feat.playbackDelay.title"
      descriptionKey="feat.playbackDelay.description"
      valueLabelKey="plural.second_other"
      value={playbackDelay}
      setValue={PreferenceSetters.setPlaybackDelay}
    />
  );
}
