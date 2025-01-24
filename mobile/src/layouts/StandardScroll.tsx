import { cn } from "~/lib/style";
import { ScrollView } from "~/components/Defaults";

/** Simple scroll container layout. */
export function StandardScrollLayout(props: {
  children: React.ReactNode;
  contentContainerClassName?: string;
}) {
  return (
    <ScrollView
      contentContainerClassName={cn(
        "grow gap-6 p-4",
        props.contentContainerClassName,
      )}
    >
      {props.children}
    </ScrollView>
  );
}
