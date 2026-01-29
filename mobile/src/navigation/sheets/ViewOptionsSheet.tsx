import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { GridView } from "~/resources/icons/GridView";
import { Sort } from "~/resources/icons/Sort";
import { ViewAgenda } from "~/resources/icons/ViewAgenda";
import { ViewModule } from "~/resources/icons/ViewModule";
import { useViewPreferenceStore } from "~/stores/ViewPreference/store";
import { ViewPreferenceSetters } from "~/stores/ViewPreference/actions";

import { SortSheet } from "~/navigation/sheets/SortSheet";

import { IconButton } from "~/components/Form/Button/Icon";
import { SegmentedList } from "~/components/List/Segmented";
import { Marquee } from "~/components/Marquee";
import { DetachedSheet } from "~/components/Sheet/Detached";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { TStyledText } from "~/components/Typography/StyledText";
import { LayoutOptions } from "~/stores/ViewPreference/constants";
import type { MutableLayout } from "~/stores/ViewPreference/types";

//#region Albums
export function AlbumsViewOptionsSheet(props: { ref: TrueSheetRef }) {
  const sortOrderSheetRef = useSheetRef();
  return (
    <>
      <DetachedSheet ref={props.ref}>
        <ScreenLayoutSetting screen="album" />

        <SegmentedList.Item
          labelTextKey="feat.modalViewPreference.extra.sort"
          onPress={() => {
            props.ref.current?.dismiss();
            sortOrderSheetRef.current?.present();
          }}
          LeftElement={<Sort />}
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
  const sortOrderSheetRef = useSheetRef();
  return (
    <>
      <DetachedSheet ref={props.ref}>
        <ScreenLayoutSetting screen="artist" />

        <SegmentedList.Item
          labelTextKey="feat.modalViewPreference.extra.sort"
          onPress={() => {
            props.ref.current?.dismiss();
            sortOrderSheetRef.current?.present();
          }}
          LeftElement={<Sort />}
          className="gap-4"
        />
      </DetachedSheet>
      <SortSheet ref={sortOrderSheetRef} screen="artist" />
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

function ScreenLayoutSetting({ screen }: { screen: MutableLayout }) {
  const { t } = useTranslation();
  const layoutOption = useViewPreferenceStore((s) => s[`${screen}Layout`]);

  return (
    <View className="min-h-8 flex-row items-center justify-between gap-2">
      <Marquee color="surfaceBright">
        <TStyledText
          textKey="feat.modalViewPreference.extra.layout"
          bold
          className="text-sm"
        />
      </Marquee>
      <View className="flex-row gap-2 rounded-full bg-surfaceContainerLowest p-0.5">
        {LayoutOptions.map((layout) => (
          <IconButton
            key={layout}
            Icon={LayoutIconMap[layout]}
            accessibilityLabel={t(`feat.modalViewPreference.extra.${layout}`)}
            onPress={() => ViewPreferenceSetters.setLayout(screen, layout)}
            _iconColor={layoutOption === layout ? "primary" : undefined}
            size="xs"
          />
        ))}
      </View>
    </View>
  );
}
//#endregion
