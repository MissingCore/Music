// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { BlurView as RawBlurView } from "@sbaiahmed1/react-native-blur";
import { View } from "react-native";
import { withUniwind } from "uniwind";

import { cn } from "~/lib/style";

const BlurView = withUniwind(RawBlurView);

type BlurWrapperProps<TWrapper extends React.ElementType = typeof View> =
  React.ComponentProps<TWrapper> & {
    Wrapper?: TWrapper;
    children: React.ReactNode;
  };

export function BlurWrapper<TWrapper extends React.ElementType = typeof View>({
  Wrapper = View,
  className,
  children,
  ...props
}: BlurWrapperProps<TWrapper>) {
  return (
    <Wrapper {...props} className={cn("relative", className)}>
      <BlurView
        blurType="regular"
        blurAmount={70}
        className="absolute inset-0"
      />
      {children}
    </Wrapper>
  );
}
