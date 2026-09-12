// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { BlurView as RawBlurView } from "@sbaiahmed1/react-native-blur";
import { View } from "react-native";
import { withUniwind } from "uniwind";

import { cn } from "~/lib/style";

const BlurView = withUniwind(RawBlurView);

export function createBlurWrapper<
  TWrapper extends React.ElementType = typeof View,
>(Wrapper?: TWrapper) {
  const WrapperElement = Wrapper ?? View;

  return function BlurWrapper({
    className,
    children,
    ...props
  }: React.ComponentProps<TWrapper> & { children: React.ReactNode }) {
    return (
      <WrapperElement {...props} className={cn("relative", className)}>
        <BlurView
          blurType="regular"
          blurAmount={70}
          className="absolute inset-0"
        />
        {children}
      </WrapperElement>
    );
  };
}
