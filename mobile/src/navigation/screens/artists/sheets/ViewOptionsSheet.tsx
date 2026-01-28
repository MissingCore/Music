import { useTranslation } from "react-i18next";
import { View } from "react-native";

import type { Icon } from "~/resources/icons/type";
import { GridView } from "~/resources/icons/GridView";
import { ViewAgenda } from "~/resources/icons/ViewAgenda";
import { ViewModule } from "~/resources/icons/ViewModule";
import { useViewPreferenceStore } from "~/stores/ViewPreference/store";
import { ViewPreferenceSetters } from "~/stores/ViewPreference/actions";

import { IconButton } from "~/components/Form/Button/Icon";
import { DetachedSheet } from "~/components/Sheet/Detached";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import type { LayoutOption } from "~/stores/ViewPreference/constants";

export function ArtistsViewOptionsSheet(props: { ref: TrueSheetRef }) {
  const { t } = useTranslation();
  const layoutOption = useViewPreferenceStore((s) => s.artistLayout);

  return (
    <DetachedSheet ref={props.ref}>
      <View className="flex-row justify-between gap-1 rounded-md bg-surfaceContainerLowest px-1">
        {LayoutActions.map((action) => (
          <IconButton
            key={action.type}
            Icon={action.Icon}
            accessibilityLabel={t(
              `feat.modalViewPreference.extra.${action.type}`,
            )}
            onPress={() =>
              ViewPreferenceSetters.setLayout("artist", action.type)
            }
            _iconColor={layoutOption === action.type ? "primary" : undefined}
          />
        ))}
      </View>
    </DetachedSheet>
  );
}

//#region Layout Configs
const LayoutActions: Array<{
  type: LayoutOption;
  Icon: (props: Icon) => React.JSX.Element;
}> = [
  { type: "list", Icon: ViewAgenda },
  { type: "grid", Icon: GridView },
  { type: "compactGrid", Icon: ViewModule },
];
//#endregion
