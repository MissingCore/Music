import { Text } from "react-native";

/** @description Display seconds in `hh:mm:ss` format. */
export function TrackDuration({ duration }: { duration: number }) {
  let timeStr = new Date(Math.floor(duration) * 1000)
    .toISOString()
    .substring(11, 19);

  // If track isn't an hour long, exclude the "hour" section.
  if (Number(timeStr.slice(0, 2)) === 0) timeStr = timeStr.slice(3);

  return (
    <Text className="shrink-0 font-geistMonoLight text-xs text-foreground100">
      {timeStr}
    </Text>
  );
}
