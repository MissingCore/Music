import type { ParseKeys } from "i18next";
import type { PressableProps } from "react-native";
import { Modal as RNModal, View } from "react-native";

import { useTheme } from "~/hooks/useTheme";

import { cn } from "~/lib/style";
import { ExtendedTButton } from "./Form/Button";
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
        topAction={props.topAction}
        bottomAction={props.bottomAction}
      />
    </Modal>
  );
}

//#region Modal Actions
type ActionOptions = Omit<PressableProps, "children"> & { textKey: ParseKeys };
type ModalActionsProp = {
  topAction: ActionOptions & {
    /** Defaults to `true`. */
    danger?: boolean;
  };
  bottomAction: ActionOptions;
};

export function ModalActions(props: ModalActionsProp) {
  const { scheme } = useTheme();
  return (
    <View className="gap-0.75">
      <ExtendedTButton
        {...props.topAction}
        className={cn(
          "rounded-b-xs bg-canvas",
          { "bg-onSurface": scheme === "dark" },
          props.topAction.className,
        )}
        textClassName={cn({ "text-red": props.topAction.danger ?? true })}
      />
      <ExtendedTButton
        {...props.bottomAction}
        className={cn(
          "rounded-t-xs bg-canvas",
          { "bg-onSurface": scheme === "dark" },
          props.bottomAction.className,
        )}
      />
    </View>
  );
}
//#endregion
