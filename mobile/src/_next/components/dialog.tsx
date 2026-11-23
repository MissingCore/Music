// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { Modal, View } from "react-native";

import { useTheme } from "~/_next/context/theme-context";

interface DialogProps {
  visible: boolean;
  onClose: VoidFunction;
  children: React.ReactNode;
}

export function Dialog(props: DialogProps) {
  const { background, border } = useTheme().colors;
  return (
    <Modal
      animationType="fade"
      visible={props.visible}
      statusBarTranslucent
      navigationBarTranslucent
      transparent
      onRequestClose={props.onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-4">
        <View
          style={{ backgroundColor: background, borderColor: border }}
          className="w-full max-w-xl gap-8 rounded-xl border p-4 pt-6"
        >
          {props.children}
        </View>
      </View>
    </Modal>
  );
}
