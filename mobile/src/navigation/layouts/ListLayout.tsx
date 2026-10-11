// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { cn } from "~/lib/style";
import type { ScrollViewProps } from "~/components/Base/ScrollView";
import { ScrollView } from "~/components/Base/ScrollView";
import { ToolbarOffset } from "~/components/next/composed/toolbar";

/** Render groups of content with standardized spacing. */
export function ListLayout({
  withToolbar = true,
  ...props
}: ScrollViewProps & { withToolbar?: boolean }) {
  return (
    <ScrollView
      {...props}
      contentContainerClassName={cn(
        "grow gap-6 p-4 pb-safe-offset-4",
        withToolbar && ToolbarOffset,
        props.contentContainerClassName,
      )}
    />
  );
}
