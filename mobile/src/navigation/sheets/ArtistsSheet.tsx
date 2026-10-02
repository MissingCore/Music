// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useNavigation } from "@react-navigation/native";

import { useSessionStore } from "~/stores/Session/store";
import { navigateToArtist } from "~/stores/Session/actions";

import { FlatList } from "~/components/Base/List";
import { DetachedSheet } from "~/components/Sheet";
import { ImageListItem } from "~/components/next/composed/image-list-item";
import { createTextPlaceholder } from "~/components/next/composed/media-image";

const GLOBAL_SHEET_KEY = "ArtistsSheet";

export function ArtistsSheet() {
  const navigation = useNavigation();
  const artistsInfo = useSessionStore((s) => s.displayedArtists);

  if (!artistsInfo || artistsInfo.artists.length === 0) return null;
  return (
    <DetachedSheet globalKey={GLOBAL_SHEET_KEY}>
      <FlatList
        data={artistsInfo.artists}
        keyExtractor={({ name }) => name}
        renderItem={({ item: { name, artwork } }) => (
          <ImageListItem
            src={artwork ?? createTextPlaceholder(name)}
            label={name}
            onPress={() => {
              TrueSheet.dismiss(GLOBAL_SHEET_KEY);
              navigateToArtist(navigation, name, artistsInfo.popStrategy);
            }}
            spacing="none"
          />
        )}
        contentContainerClassName="gap-1.5"
      />
    </DetachedSheet>
  );
}
