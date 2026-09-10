// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";

import { cn } from "~/lib/style";

export function createSlottedComponent<
  TContent extends (props: any) => React.ReactNode,
  TWrapper extends React.ElementType = typeof View,
>(args: { Content: TContent; Wrapper?: TWrapper }) {
  const { Wrapper = View, Content } = args;

  type SlottedComponentProps = React.ComponentProps<TWrapper> & {
    contentConfig: React.ComponentProps<TContent>;
    Leading?: React.ReactNode;
    Trailing?: React.ReactNode;
  };

  return function SlottedComponent({
    contentConfig,
    Leading,
    Trailing,
    className,
    ...props
  }: SlottedComponentProps) {
    return (
      <Wrapper
        {...props}
        className={cn("flex-row items-center gap-4", className)}
      >
        {Leading}
        <Content {...contentConfig} />
        {Trailing}
      </Wrapper>
    );
  };
}
