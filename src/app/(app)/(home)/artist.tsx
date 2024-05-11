import { router } from "expo-router";
import { SectionList, Text } from "react-native";

import { ArrowRight } from "@/assets/svgs/ArrowRight";
import { useArtistsForList } from "@/api/artists";

import { ActionButton } from "@/components/form/ActionButton";
import { Loading } from "@/components/ui/Loading";

/** @description Screen for `/artist` route. */
export default function ArtistScreen() {
  const { isPending, data } = useArtistsForList();

  return (
    <SectionList
      sections={data ?? []}
      keyExtractor={({ name }) => name}
      renderItem={({ item: { name, textContent } }) => (
        <ActionButton
          onPress={() => router.navigate(`/artist/${name}`)}
          textContent={textContent}
          Icon={<ArrowRight size={24} />}
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
          <Loading />
        ) : (
          <Text className="mx-auto text-center font-geistMono text-base text-foreground100">
            No Artists Found
          </Text>
        )
      }
      contentContainerClassName="w-full gap-2 px-4 pt-[22px]"
    />
  );
}
