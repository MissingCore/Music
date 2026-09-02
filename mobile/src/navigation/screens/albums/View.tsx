// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo } from "react";

import { useAlbums } from "~/data/album/queries";
import { usePreferenceStore } from "~/stores/Preference/store";
import { useSessionStore } from "~/stores/Session/store";
import { useViewLayout } from "~/stores/ViewPreference/hooks/useViewLayout";
import { useViewOrder } from "~/stores/ViewPreference/hooks/useViewOrder";

import { AlbumsViewOptionsSheet } from "~/navigation/sheets/ViewOptionsSheet";
import { NScrollListLayout } from "~/navigation/layouts/NScrollLayout";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import type { ExtractQueryData } from "~/lib/react-query";

export default function Albums() {
  const { isPending, data } = useAlbums();
  const minAlbumLength = usePreferenceStore((s) => s.minAlbumLength);
  const showSingles = useSessionStore((s) => s.showSingles);
  const showEPs = useSessionStore((s) => s.showEPs);
  const showAlbums = useSessionStore((s) => s.showAlbums);

  const filteredData = useMemo(
    () =>
      data?.filter(({ isEP, trackCount }) => {
        let condition = trackCount >= minAlbumLength;
        if (!showSingles) condition &&= trackCount > 1;
        if (!showEPs) condition &&= !isEP;
        if (!showAlbums) condition &&= trackCount === 1 || isEP;
        return condition;
      }),
    [data, minAlbumLength, showSingles, showEPs, showAlbums],
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
