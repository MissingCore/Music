import { cn } from "~/lib/style";
import type { ScrollViewProps } from "~/components/Base/ScrollView";
import { ScrollView } from "~/components/Base/ScrollView";

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
