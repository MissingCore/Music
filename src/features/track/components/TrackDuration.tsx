import { Text } from "react-native";

import { getTrackDuration } from "../utils";

/** @description Display seconds in `hh:mm:ss` format. */
export function TrackDuration({ duration }: { duration: number }) {
  return (
    <Text className="shrink-0 font-geistMonoLight text-xs text-foreground100">
      {getTrackDuration(duration)}
    </Text>
  );
}
