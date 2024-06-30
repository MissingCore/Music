import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ThemeProvider } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { StatusBar, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ToastProvider } from "react-native-toast-notifications";

import "@/assets/global.css";
import { NavigationTheme } from "@/constants/Themes";
import { queryClient } from "@/lib/react-query";
import { cn } from "@/lib/style";
import { PrevPathnameTracker } from "@/components/error/prev-pathname-tracker";
import { DeepLinkHandler } from "@/components/navigation/DeepLinkHandler";

/**
 * @description The general providers used in our app. Also provides
 *  polyfills for methods not supported.
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <GestureHandlerRootView>
      <ToastProvider
        placement="bottom"
        duration={2000}
        offset={24}
        renderToast={(toast) => (
          <View
            style={{ marginVertical: 4 }}
            className={cn("rounded bg-surface700 p-2", {
              "bg-accent500": toast.type === "danger",
            })}
          >
            <Text className="font-geistMono text-sm text-foreground50">
              {toast.message}
            </Text>
          </View>
        )}
      >
        <QueryClientProvider client={queryClient}>
          <DeepLinkHandler />
          <PrevPathnameTracker />
          <ThemeProvider value={NavigationTheme}>
            <BottomSheetModalProvider>
              <StatusBar barStyle="light-content" />
              {children}
            </BottomSheetModalProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ToastProvider>
    </GestureHandlerRootView>
  );
}
