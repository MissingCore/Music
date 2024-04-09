import Ionicons from "@expo/vector-icons/Ionicons";

import Colors from "@/constants/Colors";
import ActionButton from "@/components/ui/ActionButton";
import type { OptString } from "@/components/ui/TextStack";
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
    <ActionButton
      onPress={() =>
        console.log(
          `Now playing: ${props.textContent[0]} by ${props.textContent[1]}`,
        )
      }
      textContent={props.textContent}
      image={
        <MediaImage
          type="track"
          imgSize={48}
          imgSrc={props.coverSrc}
          className="shrink-0 rounded-sm"
        />
      }
      asideContent={<TrackDuration duration={props.duration} />}
      icon={
        <Ionicons
          name="ellipsis-vertical"
          size={24}
          color={Colors.foreground100}
        />
      }
      iconOnPress={() => console.log("View Track Options")}
    />
  );
}
