import type { ParseKeys } from "i18next";
import { useTranslation } from "react-i18next";
import { Modal as RNModal, Pressable, View } from "react-native";

import { cn } from "~/lib/style";
import { StyledText } from "~/components/Typography/StyledText";

export function Modal(props: { visible: boolean; children: React.ReactNode }) {
  return (
    <RNModal
      animationType="fade"
      visible={props.visible}
      statusBarTranslucent
      transparent
    >
      <View className="flex-1 items-center justify-center bg-neutral0/50 px-4">
        <View className="w-full gap-8 rounded-md bg-canvasAlt px-4">
          {props.children}
        </View>
      </View>
    </RNModal>
  );
}

/** Text-based button to be used inside a modal. */
export function ModalAction(props: {
  textKey: ParseKeys;
  onPress: () => void | Promise<void>;
  danger?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={props.onPress}
      className="min-h-12 min-w-12 shrink px-2 py-4 active:opacity-50"
    >
      <StyledText
        className={cn("text-right text-sm", { "text-red": props.danger })}
      >
        {t(props.textKey).toLocaleUpperCase()}
      </StyledText>
    </Pressable>
  );
}
