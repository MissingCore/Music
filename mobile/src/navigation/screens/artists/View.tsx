import { useArtists } from "~/queries/artist";
import { useViewLayout } from "~/stores/ViewPreference/hooks";

import {
  NScrollListHeader,
  NScrollListLayout,
} from "~/navigation/layouts/NScrollListLayout";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";
import { ArtistsViewOptionsSheet } from "./sheets/ViewOptionsSheet";

import type { ExtractQueryData } from "~/lib/react-query";
import type { LayoutItem } from "~/stores/ViewPreference/types";

export default function Artists() {
  const { isPending, data } = useArtists();
  const presets = useViewLayout("artist", data, formatData);

  return (
    <>
      <NScrollListHeader
        titleKey="term.artist"
        OptionsSheet={ArtistsViewOptionsSheet}
      />
      <NScrollListLayout
        ListEmptyComponent={
          <ContentPlaceholder
            isPending={isPending}
            errMsgKey="err.msg.noArtists"
          />
        }
        {...presets}
      />
    </>
  );
}

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
