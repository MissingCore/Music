import { ScrollView } from "react-native";

/** Simple scroll container layout. */
export function StandardScrollLayout(props: { children: React.ReactNode }) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerClassName="grow gap-6 p-4"
    >
      {props.children}
    </ScrollView>
  );
}
