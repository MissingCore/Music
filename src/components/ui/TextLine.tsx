import { Text } from "react-native";

/** @description Shorthand for `<Text numberOfLines={1} />`. */
export default function TextLine(props: Text["props"]) {
  return <Text numberOfLines={1} {...props} />;
}
