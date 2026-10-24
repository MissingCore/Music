import type { RootStack } from "../src/navigation/routes";

interface String {
  // https://github.com/microsoft/TypeScript/issues/41638#issuecomment-1858309778
  split(splitter: ""): string[];
  split(splitter: string): [string, ...string[]];
}

type RootStackType = typeof RootStack;

declare module "@react-navigation/native" {
  interface RootNavigator extends RootStackType {}
}
