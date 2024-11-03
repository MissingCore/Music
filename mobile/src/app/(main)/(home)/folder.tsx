import { useIsFocused } from "@react-navigation/native";
import type { FlashListProps } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BackHandler,
  Pressable,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  FadeInLeft,
  FadeOutRight,
  scrollTo,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import type { FileNode } from "@/db/schema";
import { getFolder } from "@/db/queries";
import { formatTracksForTrack } from "@/db/utils/formatters";

import {
  StickyActionListLayout,
  useStickyActionListLayoutRef,
} from "@/layouts";

import { fileNodeKeys } from "@/constants/QueryKeys";
import { cn } from "@/lib/style";
import type { Maybe } from "@/utils/types";
import { Ripple } from "@/components/new/Form";
import { Loading } from "@/components/new/Loading";
import { StyledText } from "@/components/new/Typography";
import { MediaImage, Track } from "@/modules/media/components";
import type { PlayListSource } from "@/modules/media/types";

type FolderData = FileNode | Track.Content;

/** Screen for `/folder` route. */
export default function FolderScreen() {
  const { t } = useTranslation();
  const isFocused = useIsFocused();
  const listRef = useStickyActionListLayoutRef<FolderData>();
  const [dirSegments, setDirSegments] = useState<string[]>([]);

  const fullPath = dirSegments.join("/");

  const { isPending, data } = useFolderContent(fullPath);

  useEffect(() => {
    // Prevent event from working when this screen isn't focused.
    if (!isFocused) return;

    // Make sure we start at the beginning whenever the directory segments change.
    listRef.current?.scrollToOffset({ offset: 0 });

    // Pop a directory segment if we detect a back gesture/action.
    const onBackPress = () => {
      if (dirSegments.length === 0) return false;
      setDirSegments((prev) => prev.toSpliced(-1, 1));
      return true;
    };

    BackHandler.addEventListener("hardwareBackPress", onBackPress);

    return () => {
      BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    };
  }, [dirSegments, isFocused, listRef]);

  // Information about this track list.
  const trackSource = { type: "folder", id: `${fullPath}/` } as const;

  return (
    <StickyActionListLayout
      listRef={listRef}
      title={t("common.folder")}
      StickyAction={
        <Breadcrumbs
          dirSegments={dirSegments}
          setDirSegments={setDirSegments}
        />
      }
      estimatedActionSize={48}
      {...FolderListPreset({
        data: [data?.subDirectories ?? [], data?.tracks ?? []].flat(),
        isPending,
        emptyMessage: t("response.noContent"),
        trackSource,
        setDirSegments,
      })}
    />
  );
}

//#region Preset
const FolderListPreset = (props: {
  data: Maybe<readonly FolderData[]>;
  emptyMessage?: string;
  isPending?: boolean;
  trackSource: PlayListSource;
  setDirSegments: React.Dispatch<React.SetStateAction<string[]>>;
}) =>
  ({
    estimatedItemSize: 56, // 48px Height + 8px Margin Botton
    data: props.data,
    keyExtractor: (_, index) => `${index}`,
    renderItem: ({ item, index }) => (
      <View className={cn({ "mt-2": index !== 0 })}>
        {isTrackContent(item) ? (
          <Track {...{ ...item, trackSource: props.trackSource }} />
        ) : (
          <Ripple
            onPress={() => props.setDirSegments((prev) => [...prev, item.name])}
            className="pr-4"
          >
            <MediaImage type="folder" size={48} source={null} radius="sm" />
            <StyledText numberOfLines={1} className="shrink grow">
              {item.name}
            </StyledText>
          </Ripple>
        )}
      </View>
    ),
    ListEmptyComponent: props.isPending ? (
      <Loading />
    ) : (
      <StyledText center>{props.emptyMessage}</StyledText>
    ),
  }) satisfies FlashListProps<FolderData>;

function isTrackContent(data: unknown): data is Track.Content {
  return Object.hasOwn(data as Track.Content, "id");
}
//#endregion

//#region Breadcrumbs
function Breadcrumbs({
  dirSegments,
  setDirSegments,
}: {
  dirSegments: string[];
  setDirSegments: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const breadcrumbsRef = useAnimatedRef<Animated.ScrollView>();
  const { width: screenWidth } = useWindowDimensions();
  const lastWidth = useSharedValue(0);
  const removedWidth = useSharedValue(0);
  const newScrollPos = useSharedValue(0);

  const onLayoutShift = (newWidth: number) => {
    // `newWidth` doesn't include the `px-4` on `<StickyActionLayout />`
    // and in `<Animated.ScrollView />`.
    newScrollPos.value = 64 + newWidth - screenWidth;
    if (newWidth < lastWidth.value) {
      removedWidth.value = withSequence(
        withTiming(lastWidth.value - newWidth, { duration: 0 }),
        withDelay(300, withTiming(0, { duration: 0 })),
      );
    }
    lastWidth.value = newWidth;
  };

  useDerivedValue(() => {
    scrollTo(breadcrumbsRef, newScrollPos.value, 0, true);
  });

  const offsetStyle = useAnimatedStyle(() => ({
    paddingRight: removedWidth.value,
  }));

  return (
    <Animated.ScrollView
      ref={breadcrumbsRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      className="rounded-md bg-surface"
      style={{ width: screenWidth - 32 }}
      contentContainerClassName="px-4"
    >
      <Animated.View
        onLayout={({ nativeEvent }) => onLayoutShift(nativeEvent.layout.width)}
        className="flex-row items-center gap-2"
      >
        {[undefined, ...dirSegments].map((dirName, idx) => (
          <Fragment key={idx}>
            {idx !== 0 ? (
              <Animated.View entering={FadeInLeft} exiting={FadeOutRight}>
                <StyledText className="px-1 text-xs">/</StyledText>
              </Animated.View>
            ) : null}
            <Animated.View entering={FadeInLeft} exiting={FadeOutRight}>
              <Pressable
                // Pop the segments we pushed onto the stack and update
                // the path segments atom accordingly.
                onPress={() => setDirSegments((prev) => prev.toSpliced(idx))}
                // `pathSegments.length` instead of `pathSegments.length - 1`
                // due to us prepending an extra entry to denote the "Root".
                disabled={idx === dirSegments.length}
                className="min-h-12 justify-center active:opacity-75"
              >
                <StyledText
                  className={cn("text-xs", {
                    "text-red": idx === dirSegments.length,
                  })}
                >
                  {dirName ?? "Root"}
                </StyledText>
              </Pressable>
            </Animated.View>
          </Fragment>
        ))}
      </Animated.View>
      {/* Animated padding to allow exiting scroll animation to look nice. */}
      <Animated.View style={offsetStyle} />
    </Animated.ScrollView>
  );
}
//#endregion

//#region Data
const useFolderContent = (path?: string) =>
  useQuery({
    queryKey: fileNodeKeys.detail(path ?? ".root"),
    queryFn: () => getFolder(path),
    select: ({ subDirectories, tracks }) => ({
      subDirectories,
      tracks: formatTracksForTrack({ type: "track", data: tracks }),
    }),
  });
//#endregion
