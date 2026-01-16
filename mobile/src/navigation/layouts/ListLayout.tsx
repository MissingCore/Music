import type { ScrollViewProps } from "react-native";

import { cn } from "~/lib/style";
import { ScrollView } from "~/components/Defaults";

/** Render groups of content with standardized spacing. */
export function ListLayout(props: ScrollViewProps) {
  return (
    <ScrollView
      {...props}
      contentContainerClassName={cn(
        "grow gap-6 p-4",
        props.contentContainerClassName,
      )}
    />
  );
}
