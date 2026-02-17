import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useNavigation } from "@react-navigation/native";

import { useSessionStore } from "~/stores/Session/store";
import { navigateToArtist } from "~/stores/Session/actions";

import { FlatList } from "~/components/Base/List";
import { DetachedSheet } from "~/components/Sheet";
import { SearchResult } from "~/modules/search/components/SearchResult";

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
          <SearchResult
            button
            type="artist"
            title={name}
            imageSource={artwork}
            onPress={() => {
              TrueSheet.dismiss(GLOBAL_SHEET_KEY);
              navigateToArtist(navigation, name, artistsInfo.popStrategy);
            }}
            className="rounded-full pr-4"
          />
        )}
        contentContainerClassName="gap-2"
      />
    </DetachedSheet>
  );
}
