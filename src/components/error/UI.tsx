import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** @description Mimicking the HTML `<code>` element. */
export function Code({ text }: { text: string }) {
  return (
    <View className="shrink rounded-sm bg-surface700 px-1 py-0.5">
      <Text className="font-geistMonoLight text-xs text-surface50">{text}</Text>
    </View>
  );
}

/** @description Container for error-related pages. */
export function ErrorContainer({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top }} className="my-8 flex-1 px-4">
      {children}
    </View>
  );
}

/** @description Title displayed on error-related pages. */
export function ErrorTitle({ title }: { title: string }) {
  return (
    <Text className="mb-4 text-center font-ndot57 text-title text-foreground50">
      {title}
    </Text>
  );
}
