import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { View } from "react-native";

import { ArrowRight } from "@/assets/svgs/ArrowRight";
import { useArtistsForList } from "@/api/artists";

import { cn } from "@/lib/style";
import { ActionButton } from "@/components/form/action-button";
import { LoadingIndicator } from "@/components/ui/loading";
import { Description, Heading } from "@/components/ui/text";

/** Screen for `/artist` route. */
export default function ArtistScreen() {
  const { isPending, data } = useArtistsForList();

  return (
    <View className="flex-1 px-4">
      <FlashList
        estimatedItemSize={66} // 58px Height + 8px Margin Bottom
        data={data}
        // Rare case where `keyExtractor` may break is when there's an
        // artist name that's a single character.
        keyExtractor={(item) => (typeof item === "string" ? item : item.name)}
        renderItem={({ item, index }) =>
          typeof item === "string" ? (
            <Heading
              as="h2"
              className={cn("mb-2 text-start", { "mt-2": index !== 0 })}
            >
              {item}
            </Heading>
          ) : (
            <View className="mb-2">
              <ActionButton
                onPress={() =>
                  router.navigate(`/artist/${encodeURIComponent(item.name)}`)
                }
                textContent={item.textContent}
                icon={{ Element: <ArrowRight size={24} /> }}
              />
            </View>
          )
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isPending ? (
            <LoadingIndicator />
          ) : (
            <Description>No Artists Found</Description>
          )
        }
        contentContainerStyle={{ paddingTop: 22 }}
      />
    </View>
  );
}
