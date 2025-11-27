import type { ParseKeys } from "i18next";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import type { TextColor } from "~/lib/style";
import { cn } from "~/lib/style";
import { Switch } from "../Form/Switch";
import { StyledText } from "../Typography/StyledText";

//#region List
/** Wrapper for list of `<ListItem />` for consistent gaps. */
export function List(props: { children: React.ReactNode; className?: string }) {
  return (
    <View className={cn("gap-[3px]", props.className)}>{props.children}</View>
  );
}
//#endregion

//#region useListPresets
/** Presets used to render a list of `<ListItem />`. */
export function useListPresets<TData extends Record<string, any>>({
  data,
  renderOptions: { getTitle, getDescription, onPress },
}: {
  data?: readonly TData[];
  renderOptions: {
    getTitle: (item: TData) => string;
    getDescription?: (item: TData) => string;
    onPress?: (item: TData) => VoidFunction;
  };
}) {
  return useMemo(
    () => ({
      estimatedItemSize: 70,
      data,
      renderItem: ({ item, index }: { item: TData; index: number }) => (
        <ListItem
          title={getTitle(item)}
          description={getDescription ? getDescription(item) : undefined}
          onPress={onPress ? onPress(item) : undefined}
          first={index === 0}
          last={index === (data?.length ?? 0) - 1}
        />
      ),
      contentContainerClassName: "gap-[3px] p-4 pb-[11px]",
    }),
    [data, getTitle, getDescription, onPress],
  );
}
//#endregion

//#region List Item
/** Static or pressable card themed after Nothing OS 3.0's setting page. */
export function ListItem(
  props: {
    // Interactivity props.
    onPress?: VoidFunction;
    disabled?: boolean;
    switchState?: boolean;
    // Content props.
    description?: string;
    icon?: React.ReactNode;
    // Styling props.
    first?: boolean;
    last?: boolean;
    largeTitle?: boolean;
    textColor?: TextColor;
    className?: string;
  } & (
    | { titleKey: ParseKeys; title?: never }
    | { titleKey?: never; title: string }
  ),
) {
  const { t } = useTranslation();

  const asButton = props.onPress !== undefined;
  const asSwitch = asButton && props.switchState !== undefined;
  const withIcon = !!props.icon;
  const usedColor = props.textColor ?? "text-foreground";

  return (
    <Pressable
      accessibilityRole={asSwitch ? "switch" : undefined}
      accessibilityState={asSwitch ? { checked: props.switchState } : undefined}
      onPress={props.onPress}
      // Have `<Pressable />` work as a `<View />` if no `onPress` is provided.
      disabled={asButton ? props.disabled : true}
      className={cn(
        "min-h-12 rounded-md bg-surface p-4",
        {
          "rounded-t-sm": !props.first,
          "rounded-b-sm": !props.last,
          "active:opacity-75 disabled:opacity-25": asButton,
          "flex-row items-center gap-4": asSwitch || withIcon,
        },
        props.className,
      )}
    >
      <View className="shrink grow gap-0.5">
        <StyledText className={cn({ "text-sm": !props.largeTitle }, usedColor)}>
          {props.titleKey ? t(props.titleKey) : props.title}
        </StyledText>
        {props.description ? (
          <StyledText className={cn("text-xs opacity-60", usedColor)}>
            {props.description}
          </StyledText>
        ) : null}
      </View>
      {asSwitch ? <Switch enabled={!!props.switchState} /> : props.icon}
    </Pressable>
  );
}
//#endregion
