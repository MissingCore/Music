import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { Text, View } from "react-native";

import { db } from "@/db";

import { AnimatedHeader } from "@/components/navigation/animated-header";

/** Screen for `/setting/insights/save-errors` route. */
export default function SaveErrorsScreen() {
  const { data } = useInvalidTracks();

  return (
    <AnimatedHeader title="SAVE ERRORS">
      <FlashList
        estimatedItemSize={66} // 58px Height + 49px Divider
        data={data}
        keyExtractor={({ id }) => id}
        renderItem={({ item, index }) => (
          <>
            {index !== 0 && <View className="my-6 h-px bg-surface850" />}
            <View className="gap-2">
              <Text className="font-geistMono text-sm text-foreground50">
                {item.uri}
              </Text>
              <Text className="font-geistMonoLight text-xs text-foreground100">
                {`[${item.errorName}] ${item.errorMessage}`}
              </Text>
            </View>
          </>
        )}
        showsVerticalScrollIndicator={false}
      />
    </AnimatedHeader>
  );
}

async function getInvalidTracks() {
  return db.query.invalidTracks.findMany();
}

const useInvalidTracks = () =>
  useQuery({
    queryKey: [{ entity: "settings", variant: "track-errors" }],
    queryFn: getInvalidTracks,
    gcTime: 0,
  });
