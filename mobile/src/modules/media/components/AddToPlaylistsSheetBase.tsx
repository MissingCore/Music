// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard } from "react-native";

import { createPlaylist } from "~/data/playlist/api";
import { usePlaylistsNames } from "~/data/playlist/queries";
import { sanitizePlaylistName } from "~/data/playlist/utils";

import { clearAllQueries } from "~/lib/react-query";
import { wait } from "~/utils/promise";
import { IconButton } from "~/components/next/base/button-icon";
import { TextInput } from "~/components/next/base/input";
import type { SheetRef } from "~/components/next/base/sheet";
import {
  Sheet,
  SheetFooter,
  SheetLegendList,
} from "~/components/next/base/sheet";
import { Text } from "~/components/next/base/typography";
import { CheckboxField } from "~/components/next/blocks/checkbox";
import { Marquee } from "~/components/next/blocks/marquee";
import { useInputForm } from "~/modules/form/useInputForm";
import { FavoritesPlaylistKey } from "../constants";

type SheetAccessType =
  { ref: SheetRef; name?: never } | { ref?: never; name: string };

interface AddToPlaylistsSheetProps {
  /** When changed, the internally tracked `inLists` will also be updated. */
  initiallyInLists?: string[];
  onToggleInPlaylist: (playlistName: string, remove: boolean) => Promise<void>;
  onResolve?: () => void | Promise<void>;
}

/**
 * Base sheet for implementing "Add To Playlist", with the ability to
 * also create a playlist at the same time.
 */
export function AddToPlaylistsSheetBase({
  ref,
  name,
  initiallyInLists,
  onToggleInPlaylist,
  onResolve,
}: AddToPlaylistsSheetProps & SheetAccessType) {
  const { data: playlistNames } = usePlaylistsNames();
  const [inLists, setInLists] = useState(new Set<string>());

  useEffect(() => {
    setInLists(new Set(initiallyInLists ?? []));
  }, [initiallyInLists]);

  const handleToggleInPlaylist = useCallback(
    async (playlistName: string, remove: boolean) => {
      try {
        await onToggleInPlaylist(playlistName, remove);
        setInLists((prev) => {
          const updatedList = new Set(prev);
          const remove = updatedList.has(playlistName);
          updatedList[remove ? "delete" : "add"](playlistName);
          return updatedList;
        });
      } catch {}
    },
    [onToggleInPlaylist],
  );

  const handleCreatedPlaylist = useCallback(
    async (playlistName: string) => {
      try {
        await createPlaylist({ name: playlistName });
        await handleToggleInPlaylist(playlistName, false);
        clearAllQueries();
      } catch (err) {
        console.log(err);
        toast.tError("err.flow.generic.title");
      }
    },
    [handleToggleInPlaylist],
  );

  const onResolveAddAction = useCallback(async () => {
    await onResolve?.();
    await wait(1);
    clearAllQueries();
  }, [onResolve]);

  return (
    <Sheet
      ref={ref}
      name={name}
      onCleanup={onResolveAddAction}
      footer={
        <SheetFooter
          className={(playlistNames?.length ?? 0) === 0 ? "pt-0" : undefined}
        >
          <PlaylistForm
            listEntries={playlistNames ?? []}
            disabled={playlistNames === undefined}
            handleCreatedPlaylist={handleCreatedPlaylist}
          />
        </SheetFooter>
      }
    >
      <SheetLegendList
        role="group"
        estimatedItemSize={52} // 48px Height + 6px Gap
        data={playlistNames}
        extraData={inLists}
        renderItem={({ item: name }) => (
          <CheckboxField
            checked={inLists.has(name)}
            onCheck={() => handleToggleInPlaylist(name, inLists.has(name))}
          >
            <Marquee>
              <Text>{name}</Text>
            </Marquee>
          </CheckboxField>
        )}
        contentContainerClassName="gap-1.5 pb-0"
      />
    </Sheet>
  );
}

//#region Form
function PlaylistForm(props: {
  listEntries: string[];
  disabled: boolean;
  handleCreatedPlaylist: (playlistName: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const inputForm = useInputForm({
    onSubmit: props.handleCreatedPlaylist,
    onError: (trimmedName) => {
      console.warn(`Failed to create playlist: ${trimmedName}`);
      toast.tError("err.flow.generic.brief");
    },
    onConstraints: (trimmedName) => {
      let isUnique = false;
      try {
        const sanitized = sanitizePlaylistName(trimmedName);
        isUnique =
          sanitized !== FavoritesPlaylistKey &&
          !props.listEntries.includes(sanitized);
      } catch {}
      return isUnique;
    },
  });

  return (
    <TextInput.Pill
      editable={!props.disabled && !inputForm.isSubmitting}
      value={inputForm.value}
      onChangeText={inputForm.onChange}
      TrailingActions={
        <IconButton
          icon="add"
          accessibilityLabel={t("form.create")}
          onPress={async () => {
            Keyboard.dismiss();
            await inputForm.onSubmit();
          }}
          disabled={!inputForm.canSubmit || inputForm.isSubmitting}
          intent="primary"
          filled
          size="md"
        />
      }
    />
  );
}
//#endregion
