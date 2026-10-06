// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { usePlaylistsNames } from "~/data/playlist/queries";
import { TrackMultiSelect, useTrackMultiSelectStore } from "../core/store";
import { updateTracksInPlaylist } from "../core/actions";

import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import { clearAllQueries } from "~/lib/react-query";
import { wait } from "~/utils/promise";
import { CheckboxField } from "~/components/Form/Checkbox";
import type { SheetRef } from "~/components/next/base/sheet";
import { Sheet } from "~/components/next/base/sheet";
import { Text } from "~/components/next/base/typography";
import { Marquee } from "~/components/next/blocks/marquee";

export function AddToPlaylistsSheet(props: { ref: SheetRef }) {
  const { t } = useTranslation();
  const { data: playlistsNames } = usePlaylistsNames();
  const amountSelected = useTrackMultiSelectStore((s) => s.selected.size);
  const [inLists, setInLists] = useState(new Set<string>());

  const toggleInPlaylist = useCallback(
    async (playlistName: string, remove = false) => {
      const status = await updateTracksInPlaylist({ playlistName, remove });
      if (status === "success") {
        setInLists((prev) => {
          const updatedList = new Set(prev);
          updatedList[remove ? "delete" : "add"](playlistName);
          return updatedList;
        });
      } else if (status === "error") {
        toast.tError("err.flow.generic.title");
      }
    },
    [],
  );

  // Reset selection whenever the number of items of selected items change.
  useEffect(() => {
    setInLists(new Set());
  }, [amountSelected]);

  return (
    <Sheet ref={props.ref} onCleanup={resolveAddAction} snapTop>
      <Sheet.Header label={t("feat.modalTrack.extra.addToPlaylist")} />
      <Sheet.List
        estimatedItemSize={52} // 48px Height + 6px Gap
        data={playlistsNames}
        keyExtractor={(name) => name}
        extraData={inLists}
        renderItem={({ item: name }) => (
          <CheckboxField
            checked={inLists.has(name)}
            onCheck={() => toggleInPlaylist(name, inLists.has(name))}
          >
            <Marquee>
              <Text>{name}</Text>
            </Marquee>
          </CheckboxField>
        )}
        ListEmptyComponent={
          <ContentPlaceholder errMsgKey="err.msg.noPlaylists" />
        }
        contentContainerClassName="gap-1.5"
      />
    </Sheet>
  );
}

/** Dismiss multi-select menu when we finish adding the selected tracks to the playlists. */
async function resolveAddAction() {
  TrackMultiSelect.reset();
  await wait(1);
  clearAllQueries();
}
