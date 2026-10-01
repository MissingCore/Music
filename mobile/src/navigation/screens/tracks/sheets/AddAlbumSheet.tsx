// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useAlbums } from "~/data/album/queries";
import type { AlbumSummary } from "~/data/album/types";

import { DetachedSheet } from "~/components/Sheet";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { ImageListItem } from "~/components/next/composed/image-list-item";
import { SearchList } from "~/modules/search/components/SearchList";
import { containSorter } from "~/modules/search/utils";

export function AddAlbumSheet(props: {
  ref: TrueSheetRef;
  onSelect: (data: AlbumSummary) => void;
}) {
  const { data } = useAlbums();
  return (
    <DetachedSheet ref={props.ref} snapTop>
      <SearchList
        data={data}
        keyExtractor={({ id }) => id}
        onFilterData={(query, data) => containSorter(data, query, "name")}
        renderItem={({ item }) => (
          <ImageListItem
            label={item.name}
            supporting={item.artistName}
            src={item.artwork}
            onPress={() => props.onSelect(item)}
          />
        )}
        nestedScrollEnabled
        shadowTransitionConfig={{ color: "surfaceBright" }}
        renderOnQuery
        className="-mx-0.5 -mb-1"
        contentContainerClassName="pb-4"
      />
    </DetachedSheet>
  );
}
