import { requireNativeView } from "expo";
import * as React from "react";

import type { NativeUtilsViewProps } from "./NativeUtils.types";

const NativeView: React.ComponentType<NativeUtilsViewProps> =
  requireNativeView("NativeUtils");

export default function NativeUtilsView(props: NativeUtilsViewProps) {
  return <NativeView {...props} />;
}
