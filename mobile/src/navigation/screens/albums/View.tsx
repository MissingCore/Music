// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo } from "react";

import { useAlbums } from "~/data/album/queries";
import { usePreferenceStore } from "~/stores/Preference/store";
import { useViewLayout } from "~/stores/ViewPreference/hooks/useViewLayout";
import { useViewOrder } from "~/stores/ViewPreference/hooks/useViewOrder";

import { AlbumsViewOptionsSheet } from "~/navigation/sheets/ViewOptionsSheet";
import { NScrollListLayout } from "~/navigation/layouts/NScrollLayout";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import type { ExtractQueryData } from "~/lib/react-query";

export default function Albums() {
  const { isPending, data } = useAlbums();
  const minAlbumLength = usePreferenceStore((s) => s.minAlbumLength);

  const filteredData = useMemo(
    () => data?.filter(({ trackCount }) => trackCount >= minAlbumLength),
    [data, minAlbumLength],
  );

  const sortedData = useViewOrder("album", filteredData);
  const presets = useViewLayout("album", sortedData, formatData);

  return (
    <NScrollListLayout
      titleKey="term.albums"
      OptionsSheet={AlbumsViewOptionsSheet}
      ListEmptyComponent={
        <ContentPlaceholder
          isPending={isPending || presets.data === undefined}
          errMsgKey="err.msg.noAlbums"
        />
      }
      {...presets}
    />
  );
}

//#region Utils
type AlbumData = ExtractQueryData<typeof useAlbums>[number];

function formatData({ id, name, artistName, artwork }: AlbumData) {
  return { id, title: name, description: artistName, imageSource: artwork };
}
//#endregion
