// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { cn } from "~/lib/style";
import { Pressable } from "../Base/Pressable";
import { IconButton } from "../Form/Button/Icon";

type RemovableItemProps = {
  /** Used for the `accessibilityLabel` for translation term `template.entryRemove`. */
  label: string;
  onRemove: VoidFunction;
  disableRemove?: boolean;
  children: React.ReactNode;
  className?: string;

  /** Providing this prop will change the wrapper to a `Pressable`. */
  onPress?: VoidFunction;
  disabled?: boolean;
};

/** Pre-styled component with a built-in remove button. */
export const RemovableItem = memo(function RemovableItem(
  props: RemovableItemProps,
) {
  const { t } = useTranslation();

  const Wrapper = useMemo(
    () => (props.onPress ? Pressable : View),
    [props.onPress],
  );

  const wrapperProps = useMemo(() => {
    if (!props.onPress) return {};
    return { onPress: props.onPress, disabled: props.disabled };
  }, [props.onPress, props.disabled]);

  return (
    <Wrapper
      {...wrapperProps}
      className={cn("min-h-12 flex-row items-center gap-1", props.className)}
    >
      <IconButton
        icon="do-not-disturb-on"
        accessibilityLabel={t("template.entryRemove", { name: props.label })}
        onPress={props.onRemove}
        disabled={props.disableRemove}
        size="xs"
      />
      {props.children}
    </Wrapper>
  );
});
