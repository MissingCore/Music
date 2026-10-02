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
            src={item.artwork}
            label={item.name}
            supporting={item.artistName}
            onPress={() => props.onSelect(item)}
            spacing="none"
          />
        )}
        nestedScrollEnabled
        shadowTransitionConfig={{ color: "surfaceBright" }}
        renderOnQuery
        contentContainerClassName="gap-1.5 pb-4"
      />
    </DetachedSheet>
  );
}
