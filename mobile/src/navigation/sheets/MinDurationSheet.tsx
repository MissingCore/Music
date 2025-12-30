import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";

import { DetachedNumericSheet } from "~/components/Sheet/DetachedNumeric";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";

export function MinDurationSheet(props: { ref: TrueSheetRef }) {
  const minSeconds = usePreferenceStore((s) => s.minSeconds);
  return (
    <DetachedNumericSheet
      ref={props.ref}
      titleKey="feat.minTrackDuration.title"
      valueLabelKey="plural.second_other"
      value={minSeconds}
      setValue={PreferenceSetters.setMinSeconds}
    />
  );
}
