import { View } from "react-native";

import { GridView } from "~/resources/icons/GridView";
import { ViewAgenda } from "~/resources/icons/ViewAgenda";
import { ViewModule } from "~/resources/icons/ViewModule";
import { useArtists } from "~/queries/artist";
import { useHomeViewPreferenceStore } from "~/stores/HomeViewPreference/store";
import { HomeViewPreferenceSetters } from "~/stores/HomeViewPreference/actions";
import { useHomeViewLayout } from "~/stores/HomeViewPreference/hooks";

import { StickyActionListLayout } from "~/navigation/layouts/StickyActionScroll";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import type { ExtractQueryData } from "~/lib/react-query";
import { IconButton } from "~/components/Form/Button/Icon";
import type { LayoutItem } from "~/stores/HomeViewPreference/types";

export default function Artists() {
  const { isPending, data } = useArtists();
  const presets = useHomeViewLayout("artist", data, formatData);

  return (
    <StickyActionListLayout
      titleKey="term.artists"
      StickyAction={<ArtistActions />}
      estimatedActionSize={48}
      ListEmptyComponent={
        <ContentPlaceholder
          isPending={isPending}
          errMsgKey="err.msg.noArtists"
        />
      }
      {...presets}
    />
  );
}

//#region Actions
function ArtistActions() {
  const layoutOption = useHomeViewPreferenceStore((s) => s.artistLayout);
  return (
    <View className="w-full flex-row items-center justify-between gap-2 rounded-md bg-surfaceContainerLowest">
      <IconButton
        Icon={ViewAgenda}
        accessibilityLabel=""
        onPress={() => HomeViewPreferenceSetters.setLayout("artist", "list")}
        _iconColor={layoutOption === "list" ? "primary" : undefined}
      />
      <IconButton
        Icon={GridView}
        accessibilityLabel=""
        onPress={() => HomeViewPreferenceSetters.setLayout("artist", "grid")}
        _iconColor={layoutOption === "grid" ? "primary" : undefined}
      />
      <IconButton
        Icon={ViewModule}
        accessibilityLabel=""
        onPress={() =>
          HomeViewPreferenceSetters.setLayout("artist", "compactGrid")
        }
        _iconColor={layoutOption === "compactGrid" ? "primary" : undefined}
      />
    </View>
  );
}
//#endregion

//#region Utils
function formatData(
  item: ExtractQueryData<typeof useArtists>[number],
): LayoutItem {
  return {
    id: item.name,
    title: item.name,
    description: "10 Tracks", // FIXME: Temporary
    imageSource: item.artwork,
  };
}
//#endregion
