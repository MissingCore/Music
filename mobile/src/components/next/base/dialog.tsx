// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { GestureResponderEvent } from "react-native";
import { Modal, View } from "react-native";

import { GestureHandlerRootView } from "~/components/Base/GestureHandlerRootView";
import { Button } from "./button";
import { Card } from "./card";
import { TText } from "./typography";

function Dialog(props: { visible: boolean; children: React.ReactNode }) {
  return (
    <Modal
      animationType="fade"
      visible={props.visible}
      statusBarTranslucent
      navigationBarTranslucent
      transparent
    >
      <GestureHandlerRootView className="flex-1 items-center justify-center bg-black/50 px-4">
        <Card className="w-full max-w-xl gap-8 pt-6">{props.children}</Card>
      </GestureHandlerRootView>
    </Modal>
  );
}

//#region Actions
function Actions(props: {
  onConfirm: (e: GestureResponderEvent) => void;
  onCancel: (e: GestureResponderEvent) => void;
}) {
  return (
    <View className="gap-0.75">
      <Button
        onPress={props.onConfirm}
        className="rounded-b-xs bg-surfaceContainer"
      >
        <TText
          textKey="form.confirm"
          numberOfLines={1}
          bold
          size="sm"
          className="text-error"
        />
      </Button>
      <Button
        onPress={props.onCancel}
        className="rounded-t-xs bg-surfaceContainer"
      >
        <TText textKey="form.cancel" numberOfLines={1} bold size="sm" />
      </Button>
    </View>
  );
}
//#endregion

//#region Exports
Dialog.Actions = Actions;

export { Dialog };
//#endregion
