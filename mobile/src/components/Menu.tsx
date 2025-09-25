import type { ParseKeys } from "i18next";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Menu as PaperMenu } from "react-native-paper";

import { MoreVert } from "~/resources/icons/MoreVert";
import { useTheme } from "~/hooks/useTheme";

import { BorderRadius, FontSize } from "~/constants/Styles";
import { IconButton } from "./Form/Button";

export type MenuAction = {
  labelKey: ParseKeys;
  onPress: VoidFunction;
};

export function Menu(props: {
  triggerLabel?: ParseKeys;
  actions: MenuAction[];
}) {
  const { t } = useTranslation();
  const { surface, onSurface, foreground } = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <PaperMenu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <IconButton
          Icon={MoreVert}
          accessibilityLabel={t(props.triggerLabel ?? "term.more")}
          onPress={() => setVisible(true)}
        />
      }
      anchorPosition="bottom"
      mode="flat"
      contentStyle={{
        overflow: "hidden",
        paddingVertical: 0,
        backgroundColor: surface,
        borderRadius: BorderRadius.md,
      }}
    >
      {props.actions.map(({ labelKey, onPress }) => (
        <PaperMenu.Item
          key={labelKey}
          title={t(labelKey)}
          onPress={() => {
            onPress();
            setVisible(false);
          }}
          rippleColor={onSurface}
          titleStyle={{
            color: foreground,
            fontSize: FontSize.base,
          }}
        />
      ))}
    </PaperMenu>
  );
}
