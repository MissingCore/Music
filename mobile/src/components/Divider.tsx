// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";

import { cn } from "~/lib/style";

/** Simple `1px` tall divider. */
export function Divider({ className }: { className?: string }) {
  return <View className={cn("h-px bg-outlineVariant", className)} />;
}
