import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { GridView } from "~/resources/icons/GridView";
import { ViewAgenda } from "~/resources/icons/ViewAgenda";
import { ViewModule } from "~/resources/icons/ViewModule";
import { useViewPreferenceStore } from "~/stores/ViewPreference/store";
import { ViewPreferenceSetters } from "~/stores/ViewPreference/actions";

import { IconButton } from "~/components/Form/Button/Icon";
import { DetachedSheet } from "~/components/Sheet/Detached";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";

export function ArtistsViewOptionsSheet(props: { ref: TrueSheetRef }) {
  const { t } = useTranslation();
  const layoutOption = useViewPreferenceStore((s) => s.artistLayout);

  return (
    <DetachedSheet ref={props.ref}>
      <View className="flex-row justify-between gap-1 rounded-md bg-surfaceContainerLowest px-1">
        <IconButton
          Icon={ViewAgenda}
          accessibilityLabel={t(`feat.modalViewPreference.extra.list`)}
          onPress={() => ViewPreferenceSetters.setLayout("artist", "list")}
          _iconColor={layoutOption === "list" ? "primary" : undefined}
        />
        <IconButton
          Icon={GridView}
          accessibilityLabel={t(`feat.modalViewPreference.extra.grid`)}
          onPress={() => ViewPreferenceSetters.setLayout("artist", "grid")}
          _iconColor={layoutOption === "grid" ? "primary" : undefined}
        />
        <IconButton
          Icon={ViewModule}
          accessibilityLabel={t(`feat.modalViewPreference.extra.compactGrid`)}
          onPress={() =>
            ViewPreferenceSetters.setLayout("artist", "compactGrid")
          }
          _iconColor={layoutOption === "compactGrid" ? "primary" : undefined}
        />
      </View>
    </DetachedSheet>
  );
}
