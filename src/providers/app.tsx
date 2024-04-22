/* Polyfills */
import "core-js/features/array/to-reversed";
import "core-js/features/array/to-sorted";
import "core-js/features/array/to-spliced";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { ThemeProvider } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import "@/assets/global.css";
import NavigationTheme from "@/constants/Theme";
import { queryClient } from "@/lib/react-query";

/**
 * @description The general providers used in our app. Also provides
 *  polyfills for methods not supported.
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={NavigationTheme}>
          <BottomSheetModalProvider>
            <StatusBar style="light" />
            {children}
          </BottomSheetModalProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
