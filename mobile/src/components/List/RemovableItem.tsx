import { memo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { DoNotDisturbOn } from "~/resources/icons/DoNotDisturbOn";

import { cn } from "~/lib/style";
import { IconButton } from "../Form/Button/Icon";

type RemovableItemProps = {
  label: string;
  onRemove: VoidFunction;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
};

/** Pre-styled component with a built-in remove button. */
export const RemovableItem = memo(function RemovableItem(
  props: RemovableItemProps,
) {
  const { t } = useTranslation();
  return (
    <View
      className={cn("min-h-12 flex-row items-center gap-1", props.className)}
    >
      <IconButton
        Icon={DoNotDisturbOn}
        accessibilityLabel={t("template.entryRemove", { name: props.label })}
        onPress={props.onRemove}
        disabled={props.disabled}
        size="xs"
      />
      {props.children}
    </View>
  );
});
