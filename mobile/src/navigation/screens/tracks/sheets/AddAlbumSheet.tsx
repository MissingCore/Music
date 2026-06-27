// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useAlbums } from "~/data/album/queries";
import type { AlbumSummary } from "~/data/album/types";

import { DetachedSheet } from "~/components/Sheet";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { SearchList } from "~/modules/search/components/SearchList";
import { SearchResult } from "~/modules/search/components/SearchResult";
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
          <SearchResult
            type="album"
            title={item.name}
            description={item.artistName}
            imageSource={item.artwork}
            onPress={() => props.onSelect(item)}
            className="mb-2 pr-4"
          />
        )}
        nestedScrollEnabled
        shadowTransitionConfig={{ color: "surfaceBright" }}
        renderOnQuery
        className="-mb-2"
        contentContainerClassName="pb-4"
      />
    </DetachedSheet>
  );
}
