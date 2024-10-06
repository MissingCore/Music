import { View } from "react-native";
import { ToastProvider as RNTNProvider } from "react-native-toast-notifications";

import { cn } from "@/lib/style";
import { StyledText } from "@/components/new/Typography";

/** Customize the style of the toasts displayed by `react-native-toast-notifications`. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <RNTNProvider
      placement="bottom"
      duration={3000}
      offset={24}
      renderToast={({ type, message }) => (
        <View
          style={{ margin: 4 }}
          className={cn("rounded bg-surface p-2", {
            "bg-red": type === "danger",
          })}
        >
          <StyledText
            className={cn("text-sm", {
              "text-neutral100": type === "danger",
            })}
          >
            {message}
          </StyledText>
        </View>
      )}
    >
      {children}
    </RNTNProvider>
  );
}
