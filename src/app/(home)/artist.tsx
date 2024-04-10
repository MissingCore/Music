import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { ActivityIndicator, SectionList, Text } from "react-native";

import { useGroupedArtists } from "@/features/artist/api/getArtists";

import Colors from "@/constants/Colors";
import { ActionButton } from "@/components/ui/ActionButton";
import { trackCountStr } from "@/features/track/utils";

/** @description Screen for `/artist` route. */
export default function ArtistScreen() {
  const router = useRouter();
  const { isPending, data } = useGroupedArtists();

  return (
    <SectionList
      sections={data}
      keyExtractor={({ id }) => id}
      renderItem={({ item: { id, name, numTracks } }) => (
        <ActionButton
          onPress={() => router.navigate(`/artist/${id}`)}
          textContent={[name, trackCountStr(numTracks)]}
          icon={
            <Ionicons
              name="arrow-forward-sharp"
              size={24}
              color={Colors.foreground100}
            />
          }
          wrapperClassName="h-14 px-2"
        />
      )}
      renderSectionHeader={({ section: { title } }) => (
        <Text className="font-ndot57 text-subtitle text-foreground50">
          {title}
        </Text>
      )}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        isPending ? (
          <ActivityIndicator
            size="large"
            color={Colors.surface500}
            className="mx-auto"
          />
        ) : (
          <Text className="mx-auto text-center font-geistMono text-base text-foreground100">
            No Artists Found
          </Text>
        )
      }
      contentContainerClassName="mt-5 w-full gap-2 px-4 pb-16"
    />
  );
}
