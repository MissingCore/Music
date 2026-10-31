// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { SheetRef } from "~/components/next/base/sheet";
import {
  Sheet,
  SheetHeader,
  SheetLegendList,
} from "~/components/next/base/sheet2";
import { SearchEngineList } from "~/modules/search/components/SearchEngine";
import { Search } from "~/modules/search/components/SearchList";
import type { SearchCallbacks } from "~/modules/search/types";

/** List of media we want to appear in the search. */
const searchScope = ["album", "folder", "track"] as const;

/** Enables us to add music to a playlist. */
export function AddMusicSheet(props: {
  ref: SheetRef;
  callbacks: Pick<SearchCallbacks, (typeof searchScope)[number]>;
}) {
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
        <SearchEngineList
          CustomList={SheetLegendList}
          searchScope={searchScope}
          callbacks={props.callbacks}
          forSheets
        />
      </Sheet>
    </Search.Provider>
  );
}
