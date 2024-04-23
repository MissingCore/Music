import Ionicons from "@expo/vector-icons/Ionicons";
import UnwrappedBottomSheet, {
  BottomSheetSectionList,
} from "@gorhom/bottom-sheet";
import { useAtomValue, useSetAtom } from "jotai";
import { cssInterop } from "nativewind";
import { useCallback, useMemo, useRef } from "react";
import { Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { trackListsDataAtom } from "@/features/playback/api/configs";
import { removeTrackAtQueueIdxAtom } from "@/features/playback/api/playing";
import { modalConfigAtom } from "../store";

import Colors from "@/constants/Colors";
import { MediaImage } from "@/components/media/MediaImage";
import { ActionButton } from "@/components/ui/ActionButton";
import { TextLine } from "@/components/ui/Text";
import { Backdrop } from "../components/Backdrop";

const BottomSheet = cssInterop(UnwrappedBottomSheet, {
  className: "style",
  backgroundClassName: "backgroundStyle",
  handleClassName: "handleStyle",
  handleIndicatorClassName: "handleIndicatorStyle",
});

/** @description Modal used for seeing upcoming tracks. */
export function UpcomingListModal() {
  const insets = useSafeAreaInsets();
  const setModalConfig = useSetAtom(modalConfigAtom);
  const listData = useAtomValue(trackListsDataAtom);
  const removeTrackAtQueueIdx = useSetAtom(removeTrackAtQueueIdxAtom);

  const bottomSheetRef = useRef<UnwrappedBottomSheet>(null);
  const snapPoints = useMemo(() => ["60%", "100%"], []);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) setModalConfig(null);
    },
    [setModalConfig],
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      topInset={insets.top}
      backdropComponent={Backdrop}
      backgroundClassName="bg-surface800"
      handleIndicatorClassName="bg-surface500"
    >
      <BottomSheetSectionList
        sections={listData ?? []}
        keyExtractor={({ id }, index) => `${id}${index}`}
        renderItem={({ item, section: { title }, index }) => {
          const isQueue = title === "Next in Queue";
          return (
            <ActionButton
              onPress={isQueue ? () => removeTrackAtQueueIdx(index) : undefined}
              textContent={[item.name, item.artistName]}
              image={
                <MediaImage
                  type="track"
                  imgSize={48}
                  imgSrc={item.coverSrc}
                  className="shrink-0 rounded-sm"
                />
              }
              icon={
                isQueue ? (
                  <Ionicons
                    name="remove-circle-outline"
                    size={24}
                    color={Colors.accent50}
                  />
                ) : (
                  <></>
                )
              }
            />
          );
        }}
        renderSectionHeader={({ section: { title } }) => (
          <TextLine className="mb-2 font-ndot57 text-title text-foreground50">
            {title}
          </TextLine>
        )}
        renderSectionFooter={({ section }) => {
          if (section.data.length > 0) return null;
          return (
            <Text className="mb-2 font-geistMono text-base text-foreground100">
              No Tracks Found
            </Text>
          );
        }}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4 pb-4"
      />
    </BottomSheet>
  );
}
