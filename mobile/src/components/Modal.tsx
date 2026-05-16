import type { ParseKeys } from "i18next";
import { useState } from "react";
import { Modal as RNModal, View } from "react-native";

import { cn } from "~/lib/style";
import { GestureHandlerRootView } from "./Base/GestureHandlerRootView";
import type { PressableProps } from "./Base/Pressable";
import { ExtendedTButton } from "./Form/Button";
import { TStyledText } from "./Typography/StyledText";

export function Modal(props: { visible: boolean; children: React.ReactNode }) {
  return (
    <RNModal
      animationType="fade"
      visible={props.visible}
      statusBarTranslucent
      navigationBarTranslucent
      transparent
    >
      <GestureHandlerRootView className="flex-1 items-center justify-center bg-black/50 px-4">
        <View className="w-full max-w-xl gap-8 rounded-xl bg-surfaceContainerLowest p-4 pt-6">
          {props.children}
        </View>
      </GestureHandlerRootView>
    </RNModal>
  );
}

export function ModalTemplate(
  props: { visible: boolean; titleKey: ParseKeys } & ModalActionsProp,
) {
  return (
    <Modal visible={props.visible}>
      <TStyledText textKey={props.titleKey} style={{ fontSize: 18 }} />
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
  return (
    <View className="gap-0.75">
      <ExtendedTButton
        {...props.topAction}
        className={cn(
          "rounded-b-xs bg-surfaceContainer active:bg-surfaceContainerHigh",
          props.topAction.className,
        )}
        textClassName={cn({ "text-error": props.topAction.danger ?? true })}
      />
      <ExtendedTButton
        {...props.bottomAction}
        className={cn(
          "rounded-t-xs bg-surfaceContainer active:bg-surfaceContainerHigh",
          props.bottomAction.className,
        )}
      />
    </View>
  );
}
//#endregion

//#region Confirmable
/** Have a component with an `onPress` prop display a confirmation modal. */
export function ConfirmableAction<
  TComponent extends (props: any) => React.ReactNode,
>(props: {
  /** A component with an `onPress` prop. */
  Component: TComponent;
  componentProps: React.ComponentProps<TComponent> & { onPress: VoidFunction };
  disableModal?: boolean;
  modalMessage: [ParseKeys] | [ParseKeys, ParseKeys];
}) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      {/* @ts-expect-error - Typing is valid. */}
      <props.Component
        {...props.componentProps}
        onPress={() =>
          props.disableModal ? props.componentProps.onPress() : setVisible(true)
        }
      />
      <Modal visible={visible}>
        {props.modalMessage.map((msg) => (
          <TStyledText key={msg} textKey={msg} style={{ fontSize: 18 }} />
        ))}
        <ModalActions
          topAction={{
            textKey: "form.confirm",
            onPress: () => {
              props.componentProps.onPress();
              setVisible(false);
            },
          }}
          bottomAction={{
            textKey: "form.cancel",
            onPress: () => setVisible(false),
          }}
        />
      </Modal>
    </>
  );
}
//#endregion
