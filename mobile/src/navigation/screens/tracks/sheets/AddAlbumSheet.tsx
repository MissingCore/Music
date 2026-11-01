// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useAlbums } from "~/data/album/queries";
import type { AlbumSummary } from "~/data/album/types";

import type { SheetRef } from "~/components/next/base/sheet";
import {
  Sheet,
  SheetHeader,
  SheetLegendList,
} from "~/components/next/base/sheet";
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
      <Sheet
        ref={props.ref}
        snapTop
        header={
          <SheetHeader>
            <Search.Input />
          </SheetHeader>
        }
      >
        <Search.List
          CustomList={SheetLegendList}
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
              spacing="none"
            />
          )}
          renderOnQuery
          contentContainerClassName="gap-1.5"
        />
      </Sheet>
    </Search.Provider>
  );
}
