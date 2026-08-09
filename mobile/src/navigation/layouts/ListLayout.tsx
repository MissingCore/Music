// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cn } from "~/lib/style";
import type { ScrollViewProps } from "~/components/Base/ScrollView";
import { ScrollView } from "~/components/Base/ScrollView";

/** Render groups of content with standardized spacing. */
export function ListLayout(props: ScrollViewProps) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      {...props}
      contentContainerStyle={[
        { paddingBottom: insets.bottom + 16 },
        props.contentContainerStyle,
      ]}
      contentContainerClassName={cn(
        "grow gap-6 p-4",
        props.contentContainerClassName,
      )}
    />
  );
}
