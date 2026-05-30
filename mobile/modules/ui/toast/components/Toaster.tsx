import type { TFunction } from "i18next";
import { memo, useRef } from "react";

import { Toast } from "./Toast";
import { toastStore, useToastStore } from "../core/store";
import type { ToastTheme } from "../core/types";

type Props = {
  t: TFunction;
  theme: ToastTheme;
};

export const Toaster = memo(function Toaster(props: Props) {
  const toasts = useToastStore((s) => s.toasts);
  const translationFunctionRef = useRef(props.t);

  if (translationFunctionRef.current !== props.t) {
    translationFunctionRef.current = props.t;
    toastStore.setState({ t: props.t });
  }

  //? We'll have at most 2 toasts rendered at once (with one of them animating away).
  const visibleToasts = toasts.slice(0, 2);

  return visibleToasts.map((toast, index) => (
    <Toast
      //? The `key` is to prevent re-mounting when the other toast is removed.
      key={toast.id}
      toast={toast}
      exiting={index === 0 && visibleToasts.length > 1}
      theme={props.theme}
    />
  ));
});
