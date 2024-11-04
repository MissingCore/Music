import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClientProvider } from "@tanstack/react-query";
import { SheetProvider } from "react-native-actions-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import "@/screens/Sheets";
import { RouteHandlers } from "./RouteHandlers";
import { ThemeProvider } from "./ThemeProvider";
import { ToastProvider } from "./ToastProvider";

import { queryClient } from "@/lib/react-query";

/** All providers used by the app. */
export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <GestureHandlerRootView>
        <ToastProvider>
          <QueryClientProvider client={queryClient}>
            <RouteHandlers />
            <SheetProvider context="global">
              <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
            </SheetProvider>
          </QueryClientProvider>
        </ToastProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
