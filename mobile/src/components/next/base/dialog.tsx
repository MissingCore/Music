// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { cloneElement, useMemo } from "react";
import flattenChildren from "react-keyed-flatten-children";
import { Modal, View } from "react-native";

import { cn } from "~/lib/style";
import { GestureHandlerRootView } from "~/components/Base/GestureHandlerRootView";
import { Card } from "./card";

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
function Actions(props: { children: React.JSX.Element[] }) {
  const styledComponents = useMemo(() => {
    const nodes = flattenChildren(props.children) as React.JSX.Element[];
    return nodes.map((node, index) =>
      cloneElement(node, {
        className: cn(
          "bg-surfaceContainer",
          {
            "rounded-t-xs": index > 0,
            "rounded-b-xs": index < nodes.length - 1,
          },
          node.props.className,
        ),
      }),
    );
  }, [props.children]);
  return <View className="gap-0.75">{styledComponents}</View>;
}
//#endregion

//#region Exports
Dialog.Actions = Actions;

export { Dialog };
//#endregion
