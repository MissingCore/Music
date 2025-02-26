import type { FlashListProps } from "@shopify/flash-list";
import type { ParseKeys } from "i18next";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import type { TextColor } from "~/lib/style";
import { cn } from "~/lib/style";
import type { WithListEmptyProps } from "../Defaults";
import { FlashList } from "../Defaults";
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

//#region List Renderer
/** Represent structured data as `<ListItem />` in a `<FlashList />`. */
export function ListRenderer<TData extends Record<string, any>>({
  data,
  renderOptions: { getTitle, getDescription, onPress },
  ...props
}: WithListEmptyProps<
  Omit<FlashListProps<TData>, "renderItem"> & {
    renderOptions: {
      getTitle: (item: TData) => string;
      getDescription?: (item: TData) => string;
      onPress?: (item: TData) => () => void;
    };
  }
>) {
  return (
    <FlashList
      estimatedItemSize={70}
      data={data}
      renderItem={({ item, index }) => {
        const first = index === 0;
        const last = index === data!.length - 1;
        return (
          <ListItem
            title={getTitle(item)}
            description={getDescription ? getDescription(item) : undefined}
            onPress={onPress ? onPress(item) : undefined}
            {...{ first, last }}
            className={!last ? "mb-[3px]" : undefined}
          />
        );
      }}
      {...props}
    />
  );
}
//#endregion

//#region List Item
/** Static or pressable card themed after Nothing OS 3.0's setting page. */
export function ListItem(
  props: {
    // Interactivity props.
    onPress?: () => void;
    disabled?: boolean;
    switchState?: boolean;
    // Content props.
    description?: string;
    icon?: React.ReactNode;
    // Styling props.
    first?: boolean;
    last?: boolean;
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
        <StyledText className={cn("text-sm", usedColor)}>
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
