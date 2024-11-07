import { Toasts } from "@backpackapp-io/react-native-toast";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClientProvider } from "@tanstack/react-query";
import { SheetProvider } from "react-native-actions-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import "@/screens/Sheets";
import { RouteHandlers } from "./RouteHandlers";
import { ThemeProvider } from "./ThemeProvider";

import { queryClient } from "@/lib/react-query";

/** All providers used by the app. */
export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <GestureHandlerRootView>
          <QueryClientProvider client={queryClient}>
            <RouteHandlers />
            <SheetProvider context="global">
              <BottomSheetModalProvider>
                {children}
                <Toasts />
              </BottomSheetModalProvider>
            </SheetProvider>
          </QueryClientProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
