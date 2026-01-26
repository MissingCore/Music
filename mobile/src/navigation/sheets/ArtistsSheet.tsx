import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useNavigation } from "@react-navigation/native";

import { useSessionStore } from "~/services/SessionStore";

import { FlatList } from "~/components/Defaults";
import { DetachedSheet } from "~/components/Sheet/Detached";
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
              // Pops current screen before navigating to artist screen.
              // Useful when used on "Now Playing" screen.
              if (artistsInfo.popScreen) navigation.goBack();
              navigation.navigate("Artist", { id: name });
            }}
            className="rounded-full pr-4"
          />
        )}
        contentContainerClassName="gap-2"
      />
    </DetachedSheet>
  );
}
