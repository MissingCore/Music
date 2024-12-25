import { ScrollView } from "@/components/Defaults";

/** Simple scroll container layout. */
export function StandardScrollLayout(props: { children: React.ReactNode }) {
  return (
    <ScrollView contentContainerClassName="grow gap-6 p-4">
      {props.children}
    </ScrollView>
  );
}
