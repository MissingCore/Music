import { useMemo } from "react";

import { useAlbums } from "~/queries/album";
import { usePreferenceStore } from "~/stores/Preference/store";
import { useViewLayout } from "~/stores/ViewPreference/hooks/useViewLayout";
import { useViewOrder } from "~/stores/ViewPreference/hooks/useViewOrder";

import { ArtistsViewOptionsSheet } from "~/navigation/sheets/ViewOptionsSheet";
import {
  NScrollListHeader,
  NScrollListLayout,
} from "~/navigation/layouts/NScrollListLayout";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import type { ExtractQueryData } from "~/lib/react-query";

export default function Albums() {
  const { isPending, data } = useAlbums();
  const minAlbumLength = usePreferenceStore((s) => s.minAlbumLength);

  const filteredData = useMemo(
    () => data?.filter(({ trackCount }) => trackCount >= minAlbumLength),
    [data, minAlbumLength],
  );

  const sortedData = useViewOrder("album", filteredData, AlbumSortStrategies);
  const presets = useViewLayout("album", sortedData, formatData);

  return (
    <>
      <NScrollListHeader
        titleKey="term.albums"
        OptionsSheet={ArtistsViewOptionsSheet}
      />
      <NScrollListLayout
        ListEmptyComponent={
          <ContentPlaceholder
            isPending={isPending}
            errMsgKey="err.msg.noAlbums"
          />
        }
        {...presets}
      />
    </>
  );
}

//#region Utils
type AlbumData = ExtractQueryData<typeof useAlbums>[number];

const AlbumSortStrategies = {
  name: null,
  artistName: (a: AlbumData, b: AlbumData) =>
    a.artistName.localeCompare(b.artistName),
  duration: (a: AlbumData, b: AlbumData) => a.duration - b.duration,
  trackCount: (a: AlbumData, b: AlbumData) => a.trackCount - b.trackCount,
};

function formatData({ id, name, artistName, artwork }: AlbumData) {
  return { id, title: name, description: artistName, imageSource: artwork };
}
//#endregion
