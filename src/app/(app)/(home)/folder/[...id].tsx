import { FlashList } from "@shopify/flash-list";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import { ScrollView, Text, View } from "react-native";

import { ArrowRight } from "@/assets/svgs/ArrowRight";
import { FolderOutline } from "@/assets/svgs/MaterialSymbol";
import { useFolderContentForPath } from "@/api/file-nodes/[...id]";
import { SpecialPlaylists } from "@/features/playback/constants";

import { cn } from "@/lib/style";
import { ActionButton } from "@/components/form/action-button";
import { ScrollRow } from "@/components/ui/container";
import { ScrollShadow } from "@/components/ui/scroll-shadow";
import { Description } from "@/components/ui/text";
import { Track } from "@/features/track/components/track";

/** Screen for `/folder/[id]` route. */
export default function FolderScreen() {
  const { id = ["Music"] } = useLocalSearchParams<{ id: string[] }>();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerClassName="grow pt-5"
    >
      <View style={{ height: 34 }} className="pb-4">
        <Breadcrumbs pathSegments={id} />
        <ScrollShadow size={16} />
      </View>
      <FolderContents currPath={id.join("/")} />
    </ScrollView>
  );
}

function Breadcrumbs({ pathSegments }: { pathSegments: string[] }) {
  const breadcrumbsRef = useRef<ScrollRow.Ref>(null);

  useEffect(() => {
    if (breadcrumbsRef.current) breadcrumbsRef.current.scrollToEnd();
  }, [pathSegments]);

  return (
    <ScrollRow ref={breadcrumbsRef}>
      {pathSegments.map((dirName, idx) => (
        <View key={idx} className="flex-row gap-2">
          {idx !== 0 && (
            <Text className="px-1 font-geistMono text-sm text-foreground50">
              /
            </Text>
          )}
          <Link
            href={`/folder/${pathSegments.slice(0, idx + 1).join("/")}`}
            disabled={idx === pathSegments.length - 1}
            className={cn(
              "font-geistMono text-sm text-foreground50 active:opacity-75",
              { "text-accent50": idx === pathSegments.length - 1 },
            )}
          >
            {dirName}
          </Link>
        </View>
      ))}
    </ScrollRow>
  );
}

function FolderContents({ currPath }: { currPath: string }) {
  const { isPending, error, data } = useFolderContentForPath(currPath);

  if (isPending) return <View className="w-full flex-1 px-4" />;
  else if (error) {
    return (
      <View className="w-full flex-1 px-4">
        <Description intent="error">Error: Directory not found</Description>
      </View>
    );
  } else if (data.subDirectories.length === 0 && data.tracks.length === 0) {
    return (
      <View className="w-full flex-1 px-4">
        <Description>Directory is empty</Description>
      </View>
    );
  }

  // Information about this track list.
  const trackSource = {
    type: "playlist",
    name: SpecialPlaylists.tracks,
    id: SpecialPlaylists.tracks,
  } as const;

  return (
    <FlashList
      estimatedItemSize={66} // 58px Height + 8px Margin Bottom
      data={[...data.subDirectories, undefined, ...data.tracks]}
      keyExtractor={(_, index) => `${index}`}
      renderItem={({ item }) => {
        // Render divider if we have subdirectories & tracks.
        if (item === undefined) {
          if (data.subDirectories.length > 0 && data.tracks.length > 0)
            return <View className="mb-2 h-px bg-surface850" />;
          else return null;
        }
        return (
          <View className="mb-2">
            {isTrackContent(item) ? (
              <Track {...{ ...item, trackSource }} />
            ) : (
              <ActionButton
                onPress={() => router.push(`/folder/${currPath}/${item.name}`)}
                textContent={[item.name, null]}
                Image={
                  <View className="pointer-events-none rounded-sm bg-surface800 p-1">
                    <FolderOutline size={40} />
                  </View>
                }
                icon={{ Element: <ArrowRight size={24} /> }}
              />
            )}
          </View>
        );
      }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16 }}
    />
  );
}

function isTrackContent(data: unknown): data is Track.Content {
  return (data as Track.Content).id !== undefined;
}
