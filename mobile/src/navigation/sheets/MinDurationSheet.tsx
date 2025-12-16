import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceSetters } from "~/stores/Preference/actions";

import type { TrueSheetRef } from "~/components/Sheet";
import { DetachedNumericSheet } from "~/components/Sheet/DetachedNumeric";

export function MinDurationSheet(props: { ref: TrueSheetRef }) {
  const minSeconds = usePreferenceStore((s) => s.minSeconds);
  return (
    <DetachedNumericSheet
      ref={props.ref}
      titleKey="feat.ignoreDuration.title"
      descriptionKey="feat.ignoreDuration.description"
      valueLabelKey="plural.second_other"
      value={minSeconds}
      setValue={PreferenceSetters.setMinSeconds}
    />
  );
}
