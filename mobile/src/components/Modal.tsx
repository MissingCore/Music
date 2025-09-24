import type { ParseKeys } from "i18next";
import type { PressableProps } from "react-native";
import { Modal as RNModal, View } from "react-native";

import { useTheme } from "~/hooks/useTheme";

import { cn } from "~/lib/style";
import { Button } from "./Form/Button";
import { TStyledText } from "./Typography/StyledText";

export function Modal(props: { visible: boolean; children: React.ReactNode }) {
  return (
    <RNModal
      animationType="fade"
      visible={props.visible}
      statusBarTranslucent
      transparent
    >
      <View className="flex-1 items-center justify-center bg-neutral0/50 px-4">
        <View className="w-full gap-8 rounded-xl bg-surface p-4 pt-6">
          {props.children}
        </View>
      </View>
    </RNModal>
  );
}

export function ModalTemplate(
  props: { visible: boolean; titleKey: ParseKeys } & ModalActionsProp,
) {
  return (
    <Modal visible={props.visible}>
      <TStyledText
        textKey={props.titleKey}
        style={{ fontSize: 18, textAlign: "center" }}
      />
      <ModalActions
        leftAction={props.leftAction}
        rightAction={props.rightAction}
      />
    </Modal>
  );
}

//#region Modal Actions
type ActionOptions = Omit<PressableProps, "children"> & { textKey: ParseKeys };
type ModalActionsProp = {
  leftAction: ActionOptions;
  rightAction: ActionOptions & {
    /** Defaults to `true`. */
    danger?: boolean;
  };
};

export function ModalActions(props: ModalActionsProp) {
  const { theme } = useTheme();
  return (
    <View className="flex-row gap-[3px]">
      <Button
        {...props.leftAction}
        className={cn(
          "flex-1 rounded-r-sm bg-canvas",
          { "bg-onSurface": theme === "dark" },
          props.leftAction.className,
        )}
      >
        <TStyledText
          textKey={props.leftAction.textKey}
          className="text-center text-sm"
          bold
        />
      </Button>
      <Button
        {...props.rightAction}
        className={cn(
          "flex-1 rounded-l-sm bg-canvas",
          { "bg-onSurface": theme === "dark" },
          props.rightAction.className,
        )}
      >
        <TStyledText
          textKey={props.rightAction.textKey}
          className={cn("text-center text-sm", {
            "text-red": props.rightAction.danger ?? true,
          })}
          bold
        />
      </Button>
    </View>
  );
}
//#endregion
