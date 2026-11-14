// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, View } from "react-native";

import { createPlaylist } from "~/data/playlist/api";
import { usePlaylistsNames } from "~/data/playlist/queries";
import { sanitizePlaylistName } from "~/data/playlist/utils";

import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import { clearAllQueries } from "~/lib/react-query";
import { wait } from "~/utils/promise";
import { FlatList } from "~/components/Base/List";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import { CheckboxField } from "~/components/Form/Checkbox";
import { TextInput } from "~/components/Form/Input";
import { Marquee } from "~/components/Marquee";
import { DetachedSheet } from "~/components/Sheet";
import { useEnableSheetScroll } from "~/components/Sheet/useEnableSheetScroll";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { StyledText } from "~/components/Typography/StyledText";
import { useInputForm } from "~/modules/form/useInputForm";
import { FavoritesPlaylistKey } from "../constants";

type SheetAccessType =
  { ref: TrueSheetRef; name?: never } | { ref?: never; name: string };

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
  const sheetListHandlers = useEnableSheetScroll();

  useEffect(() => {
    setInLists(new Set(initiallyInLists ?? []));
  }, [initiallyInLists]);

  const handleToggleInPlaylist = useCallback(
    async (playlistName: string, remove: boolean, propagteError = false) => {
      try {
        await onToggleInPlaylist(playlistName, remove);
        setInLists((prev) => {
          const updatedList = new Set(prev);
          const remove = updatedList.has(playlistName);
          updatedList[remove ? "delete" : "add"](playlistName);
          return updatedList;
        });
      } catch (err) {
        if (propagteError) throw err;
      }
    },
    [onToggleInPlaylist],
  );

  const handleCreatedPlaylist = useCallback(
    async (playlistName: string) => {
      await createPlaylist({ name: playlistName });
      await handleToggleInPlaylist(playlistName, false, true);
      clearAllQueries();
    },
    [handleToggleInPlaylist],
  );

  const onResolveAddAction = useCallback(async () => {
    await onResolve?.();
    await wait(1);
    clearAllQueries();
  }, [onResolve]);

  return (
    <DetachedSheet
      ref={ref}
      globalKey={name}
      titleKey="feat.modalTrack.extra.addToPlaylist"
      onCleanup={onResolveAddAction}
      snapTop
    >
      <PlaylistForm
        listEntries={playlistNames ?? []}
        disabled={playlistNames === undefined}
        handleCreatedPlaylist={handleCreatedPlaylist}
      />
      <FlatList
        data={playlistNames}
        extraData={inLists}
        renderItem={({ item: name }) => (
          <CheckboxField
            checked={inLists.has(name)}
            onCheck={() => handleToggleInPlaylist(name, inLists.has(name))}
          >
            <Marquee color="surfaceBright">
              <StyledText>{name}</StyledText>
            </Marquee>
          </CheckboxField>
        )}
        ListEmptyComponent={
          <ContentPlaceholder errMsgKey="err.msg.noPlaylists" />
        }
        {...sheetListHandlers}
        contentContainerClassName="gap-2"
      />
    </DetachedSheet>
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
    <View className="flex-row items-center gap-2 rounded-full bg-surfaceContainerLowest">
      <TextInput
        editable={!props.disabled && !inputForm.isSubmitting}
        value={inputForm.value}
        onChangeText={inputForm.onChange}
        className="shrink grow pl-4"
      />
      <FilledIconButton
        icon="add"
        accessibilityLabel={t("form.create")}
        onPress={async () => {
          Keyboard.dismiss();
          await inputForm.onSubmit();
        }}
        disabled={!inputForm.canSubmit || inputForm.isSubmitting}
        size="md"
        theme="primary"
      />
    </View>
  );
}
//#endregion
