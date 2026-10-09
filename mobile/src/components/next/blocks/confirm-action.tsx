// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import React, { useMemo, useState } from "react";
import type { GestureResponderEvent } from "react-native";

import type { Maybe } from "~/utils/types";
import { Dialog } from "../base/dialog";
import { Text } from "../base/typography";

export function ConfirmAction(props: {
  /** Element with an `onPress` prop. */
  children: React.JSX.Element;
  prompt: [string] | [string, string];
  skipConfirmation?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  const { Anchor, onPress } = useMemo(() => {
    const onPress = props.children.props.onPress as Maybe<
      (e: GestureResponderEvent) => void
    >;
    return {
      Anchor: React.cloneElement(props.children, {
        onPress: (e: GestureResponderEvent) =>
          props.skipConfirmation ? onPress?.(e) : setVisible(true),
      }),
      onPress,
    };
  }, [props.children, props.skipConfirmation]);

  return (
    <>
      {Anchor}
      <Dialog visible={visible}>
        {props.prompt.map((msg) => (
          <Text key={msg} style={{ fontSize: 18 }}>
            {msg}
          </Text>
        ))}
        <Dialog.Actions
          onConfirm={(e) => {
            onPress?.(e);
            setVisible(false);
          }}
          onCancel={() => setVisible(false)}
        />
      </Dialog>
    </>
  );
}
