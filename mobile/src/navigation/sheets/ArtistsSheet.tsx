// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useNavigation } from "@react-navigation/native";

import { useSessionStore } from "~/stores/Session/store";
import { navigateToArtist } from "~/stores/Session/actions";

import { Sheet } from "~/components/next/base/sheet";
import { createTextPlaceholder } from "~/components/next/blocks/media-image";
import { ImageListItem } from "~/components/next/composed/image-list-item";

const GLOBAL_SHEET_KEY = "ArtistsSheet";

export function ArtistsSheet() {
  const navigation = useNavigation();
  const artistsInfo = useSessionStore((s) => s.displayedArtists);

  if (!artistsInfo || artistsInfo.artists.length === 0) return null;
  return (
    <Sheet name={GLOBAL_SHEET_KEY}>
      <Sheet.List
        estimatedItemSize={62} // 56px Height + 6px Margin Bottom
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
            spacing="row"
          />
        )}
        className="-mb-5.5"
      />
    </Sheet>
  );
}
