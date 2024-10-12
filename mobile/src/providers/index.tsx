import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { RouteHandlers } from "./RouteHandlers";
import { ThemeProvider } from "./ThemeProvider";
import { ToastProvider } from "./ToastProvider";

import { queryClient } from "@/lib/react-query";

/** All providers used by the app. */
export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <GestureHandlerRootView>
      <ThemeProvider>
        <ToastProvider>
          <QueryClientProvider client={queryClient}>
            <RouteHandlers />
            <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
          </QueryClientProvider>
        </ToastProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
