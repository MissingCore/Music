import type {
  Toast,
  ToastOptions as TOptions,
} from "@backpackapp-io/react-native-toast";
import { ToastPosition } from "@backpackapp-io/react-native-toast";
import { Text, View } from "react-native";

import { cn } from "./style";

/** Sensible defaults for toast. */
export const ToastOptions = {
  customToast: CustomToast,
  disableShadow: true,
  position: ToastPosition.BOTTOM,
  height: 36,
  providerKey: "PERSISTS",
} satisfies TOptions;

/** Render a custom toast (makes styling for light/dark mode easier). */
function CustomToast({ type, message, height, width }: Toast) {
  return (
    <View
      pointerEvents="box-none"
      style={{ minHeight: height, width }}
      className="items-center justify-center"
    >
      <View
        className={cn("rounded bg-surface p-2", {
          "bg-red": type === "error",
          "border border-onSurface": type !== "error",
        })}
      >
        <Text
          className={cn("text-center font-roboto text-sm text-foreground", {
            "text-neutral100": type === "error",
          })}
        >
          {message as string}
        </Text>
      </View>
    </View>
  );
}
