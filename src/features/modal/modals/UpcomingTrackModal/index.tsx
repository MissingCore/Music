import Ionicons from "@expo/vector-icons/Ionicons";
import { BottomSheetSectionList } from "@gorhom/bottom-sheet";
import { useAtomValue, useSetAtom } from "jotai";
import { Text } from "react-native";

import { queueRemoveAtIdxAtom } from "@/features/playback/api/queue";
import { upcomingTrackDataAtom } from "./store";

import Colors from "@/constants/Colors";
import { MediaImage } from "@/components/media/MediaImage";
import { ActionButton } from "@/components/ui/ActionButton";
import { ModalBase } from "../../components/ModalBase";
import { Title } from "../../components/ModalUI";

/** @description Modal used for seeing upcoming tracks. */
export function UpcomingTrackModal() {
  const upcomingTrackData = useAtomValue(upcomingTrackDataAtom);
  const removeTrackAtQueueIdx = useSetAtom(queueRemoveAtIdxAtom);

  return (
    <ModalBase>
      <BottomSheetSectionList
        sections={upcomingTrackData ?? []}
        keyExtractor={({ id }, index) => `${id}${index}`}
        renderItem={({ item, section: { title }, index }) => {
          const isQueue = title === "Next in Queue";
          return (
            <ActionButton
              onPress={isQueue ? () => removeTrackAtQueueIdx(index) : undefined}
              textContent={[item.name, item.artistName]}
              Image={
                <MediaImage
                  type="track"
                  size={48}
                  source={item.coverSrc}
                  className="shrink-0 rounded-sm"
                />
              }
              Icon={
                isQueue ? (
                  <Ionicons
                    name="remove-circle-outline"
                    size={24}
                    color={Colors.accent50}
                  />
                ) : undefined
              }
              withoutIcon={!isQueue}
            />
          );
        }}
        renderSectionHeader={({ section: { title } }) => (
          <Title className="mb-2 text-start">{title}</Title>
        )}
        renderSectionFooter={({ section: { data } }) => {
          if (data.length > 0) return null;
          return (
            <Text className="mb-2 font-geistMonoLight text-base text-foreground100">
              No Tracks Found
            </Text>
          );
        }}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-4"
      />
    </ModalBase>
  );
}
