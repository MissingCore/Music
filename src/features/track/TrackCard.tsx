import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable } from "react-native";

import Colors from "@/constants/Colors";
import TextStack, { type OptString } from "@/components/ui/TextStack";
import MediaImage from "../media/MediaImage";
import TrackDuration from "./TrackDuration";

/**
 * @description Displays information about the current track with 2
 *  different press scenarios (pressing the icon or the whole card will
 *  do different actions).
 */
export default function TrackCard(props: {
  id: string;
  textContent: [string, OptString];
  coverSrc?: string | null;
  duration: number;
}) {
  return (
    <Pressable
      onPress={() =>
        console.log(
          `Now playing: ${props.textContent[0]} by ${props.textContent[1]}`,
        )
      }
      className="flex-row items-center gap-2 rounded-sm border border-surface500 p-1"
    >
      <MediaImage
        type="track"
        imgSize={48}
        imgSrc={props.coverSrc}
        className="shrink-0 rounded-sm"
      />
      <TextStack content={props.textContent} wrapperClassName="flex-1" />
      <TrackDuration duration={props.duration} />
      <Pressable onPress={() => console.log("View Track Options")}>
        <Ionicons
          name="ellipsis-vertical"
          size={24}
          color={Colors.foreground100}
        />
      </Pressable>
    </Pressable>
  );
}
