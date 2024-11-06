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
} satisfies TOptions;

/** Render a custom toast (makes styling for light/dark mode easier). */
function CustomToast({ type, message, height, width }: Toast) {
  return (
    <View style={{ height, width }} className="items-center justify-center">
      <View
        className={cn("rounded bg-surface p-2", {
          "bg-red": type === "error",
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
