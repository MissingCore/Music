import type { ParseKeys } from "i18next";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Menu as PaperMenu } from "react-native-paper";

import type { Icon } from "~/resources/icons/type";
import { MoreVert } from "~/resources/icons/MoreVert";
import { usePreferenceStore } from "~/stores/Preference/store";
import { useTheme } from "~/hooks/useTheme";

import { BorderRadius, FontSize } from "~/constants/Styles";
import { getFont } from "~/lib/style";
import { IconButton } from "./Form/Button";

export type MenuAction = {
  Icon?: (props: Icon) => React.ReactNode;
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
  const primaryFont = usePreferenceStore((s) => s.primaryFont);

  return (
    <PaperMenu
      //! Menu only opens once in RN 0.81. This is a hack to enable it to be opened multiple times.
      //! - https://github.com/callstack/react-native-paper/issues/4807
      key={String(visible)}
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
      {props.actions.map(({ Icon, labelKey, onPress }) => (
        <PaperMenu.Item
          key={labelKey}
          title={t(labelKey)}
          // Icon size in menu is by default `24`.
          leadingIcon={() => (Icon ? <Icon /> : undefined)}
          onPress={() => {
            onPress();
            setVisible(false);
          }}
          background={{ color: onSurface, foreground: true }}
          titleStyle={{
            color: foreground,
            fontFamily: getFont(primaryFont),
            fontSize: FontSize.sm,
          }}
        />
      ))}
    </PaperMenu>
  );
}
