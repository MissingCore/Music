import type { SheetDefinition } from "react-native-actions-sheet";
import { registerSheet } from "react-native-actions-sheet";

// We extend some of the types here to give us great intellisense
// across the app for all registered sheets.
declare module "react-native-actions-sheet" {
  interface Sheets {}
}

export {};
