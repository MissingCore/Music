import { Text } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import { cn } from "@/lib/style";
import { TextLine } from "@/components/ui/Text";

/**
 * @description Resuable component for a horizontal-scrolling list of
 *  `<ModalButton />` or `<ModalLink />`.
 */
export function ScrollRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      overScrollMode="never"
      contentContainerClassName="grow gap-2 px-4"
    >
      {children}
    </ScrollView>
  );
}

type CustomTextProps = {
  children: React.ReactNode;
  asLine?: boolean;
  className?: string;
};

/** @description Title of a modal. */
export function Title({ children, asLine, className }: CustomTextProps) {
  const style = cn(
    "text-center font-ndot57 text-title text-foreground50",
    className,
  );

  if (asLine) return <TextLine className={style}>{children}</TextLine>;
  return <Text className={style}>{children}</Text>;
}

/** @description Subtitle of a modal. */
export function Subtitle({ children, asLine, className }: CustomTextProps) {
  const style = cn("text-center font-ndot57 text-lg text-accent50", className);

  if (asLine) return <TextLine className={style}>{children}</TextLine>;
  return <Text className={style}>{children}</Text>;
}
