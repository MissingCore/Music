interface String {
  // https://github.com/microsoft/TypeScript/issues/41638#issuecomment-1858309778
  split(splitter: ""): string[];
  split(splitter: string): [string, ...string[]];
}
