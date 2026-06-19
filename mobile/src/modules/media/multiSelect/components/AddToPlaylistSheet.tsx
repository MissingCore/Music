import { toast } from "@missingcore/ui/toast";
import { useCallback, useEffect, useState } from "react";

import { usePlaylistsNames } from "~/data/playlist/queries";
import { useTrackMultiSelectStore } from "../core/store";
import {
  resetTrackMultiSelect,
  toggleSelectedTracksToPlaylist,
} from "../core/actions";

import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import { clearAllQueries } from "~/lib/react-query";
import { wait } from "~/utils/promise";
import { FlatList } from "~/components/Base/List";
import { CheckboxField } from "~/components/Form/Checkbox";
import { Marquee } from "~/components/Marquee";
import { DetachedSheet } from "~/components/Sheet";
import { useEnableSheetScroll } from "~/components/Sheet/useEnableSheetScroll";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { StyledText } from "~/components/Typography/StyledText";

export function AddToPlaylistSheet(props: { ref: TrueSheetRef }) {
  const { data: playlistsNames } = usePlaylistsNames();
  const amountSelected = useTrackMultiSelectStore((s) => s.selected.size);
  const [inLists, setInLists] = useState(new Set<string>());
  const sheetListHandlers = useEnableSheetScroll();

  const toggleInPlaylist = useCallback(
    async (playlistName: string, removeFromList = false) => {
      try {
        await toggleSelectedTracksToPlaylist(playlistName, removeFromList);
        setInLists((prev) => {
          const updatedList = new Set(prev);
          if (removeFromList) updatedList.delete(playlistName);
          else updatedList.add(playlistName);
          return updatedList;
        });
      } catch (err) {
        console.log(err);
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
    <DetachedSheet
      ref={props.ref}
      titleKey="feat.modalTrack.extra.addToPlaylist"
      onCleanup={resolveAddAction}
      snapTop
    >
      <FlatList
        data={playlistsNames}
        keyExtractor={(name) => name}
        renderItem={({ item: name }) => (
          <CheckboxField
            checked={inLists.has(name)}
            onCheck={() => toggleInPlaylist(name, inLists.has(name))}
            className="mb-2"
          >
            <Marquee color="surfaceBright">
              <StyledText>{name}</StyledText>
            </Marquee>
          </CheckboxField>
        )}
        getItemLayout={getItemLayout}
        ListEmptyComponent={
          <ContentPlaceholder errMsgKey="err.msg.noPlaylists" />
        }
        {...sheetListHandlers}
        className="-mb-2"
        contentContainerClassName="pb-4"
      />
    </DetachedSheet>
  );
}

function getItemLayout(_: unknown, index: number) {
  // 54px Height + 8px Margin Bottom
  return { length: 62, offset: 62 * index, index };
}

/** Dismiss multi-select menu when we finish adding the selected tracks to the playlists. */
async function resolveAddAction() {
  resetTrackMultiSelect();
  await wait(1);
  clearAllQueries();
}
