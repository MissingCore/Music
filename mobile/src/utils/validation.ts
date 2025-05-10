export function isNumber(item: any): item is number {
  return typeof item === "number";
}

export function isString(item: any): item is string {
  return typeof item === "string";
}
