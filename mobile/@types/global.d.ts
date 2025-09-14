import type { StaticParamList } from "@react-navigation/native";

import type { RootStack } from "./src/navigation/routes";

interface String {
  // https://github.com/microsoft/TypeScript/issues/41638#issuecomment-1858309778
  split(splitter: ""): string[];
  split(splitter: string): [string, ...string[]];
}

namespace ReactNavigation {
  interface RootParamList extends StaticParamList<typeof RootStack> {}
}
