// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

export function isBoolean(item: any): item is boolean {
  return typeof item === "boolean";
}

export function isNumber(item: any): item is number {
  return typeof item === "number";
}

export function isRecord<
  TData extends Record<string, any> = Record<string, any>,
>(item: any): item is TData {
  return typeof item === "object" && item !== null;
}

export function isString(item: any): item is string {
  return typeof item === "string";
}
