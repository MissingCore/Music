import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { Text, View } from "react-native";

import { ArrowRight } from "@/assets/svgs/ArrowRight";
import { useArtistsForList } from "@/api/artists";

import { cn } from "@/lib/style";
import { ActionButton } from "@/components/form/ActionButton";
import { Loading } from "@/components/ui/Loading";

/** @description Screen for `/artist` route. */
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
            <Text
              className={cn(
                "mb-2 font-ndot57 text-subtitle text-foreground50",
                { "mt-2": index !== 0 },
              )}
            >
              {item}
            </Text>
          ) : (
            <View className="mb-2">
              <ActionButton
                onPress={() => router.navigate(`/artist/${item.name}`)}
                textContent={item.textContent}
                Icon={<ArrowRight size={24} />}
              />
            </View>
          )
        }
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
        contentContainerStyle={{ paddingTop: 22 }}
      />
    </View>
  );
}
