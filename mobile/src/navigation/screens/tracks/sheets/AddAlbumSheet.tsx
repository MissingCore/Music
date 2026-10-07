// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useAlbums } from "~/data/album/queries";
import type { AlbumSummary } from "~/data/album/types";

import type { SheetRef } from "~/components/next/base/sheet";
import { Sheet } from "~/components/next/base/sheet";
import { ImageListItem } from "~/components/next/composed/image-list-item";
import { Search } from "~/modules/search/components/SearchList";
import { containSorter } from "~/modules/search/utils";

export function AddAlbumSheet(props: {
  ref: SheetRef;
  onSelect: (data: AlbumSummary) => void;
}) {
  const { data } = useAlbums();
  return (
    <Search.Provider shadowColor="surfaceBright">
      <Sheet ref={props.ref} snapTop>
        <Sheet.Header>
          <Search.Input />
        </Sheet.Header>
        <Search.List
          CustomList={Sheet.List}
          estimatedItemSize={62} // 56px Height + 6px Margin Bottom
          data={data}
          keyExtractor={({ id }) => id}
          onFilterData={(query, data) => containSorter(data, query, "name")}
          renderItem={({ item }) => (
            <ImageListItem
              src={item.artwork}
              label={item.name}
              supporting={item.artistName}
              onPress={() => props.onSelect(item)}
              spacing="row"
            />
          )}
          renderOnQuery
          className="-mb-5.5"
        />
      </Sheet>
    </Search.Provider>
  );
}
