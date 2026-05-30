import type { ParseKeys } from "i18next";

import { toastStore } from "./store";
import type { Toast, ToastOptions, ToastType } from "./types";

type ToastHandler<T extends boolean> = (
  message: T extends true ? ParseKeys : string,
  options?: ToastOptions,
) => void;

const genId = (() => {
  let count = 0;
  return () => {
    count += 1;
    return `${Date.now()}-${count}`;
  };
})();

function createToast(
  message: string,
  type: ToastType,
  opts?: ToastOptions,
): Toast {
  return { id: genId(), type, message, autoDismiss: true, ...opts };
}

function createHandler<T extends boolean>(
  type: ToastType,
  i18n?: T,
): ToastHandler<T> {
  return (msg, options) => {
    const message = i18n ? toastStore.getState().t(msg as ParseKeys) : msg;
    const newToast = createToast(message, type, options);
    toastStore.setState((prev) => ({ toasts: [...prev.toasts, newToast] }));
  };
}

const toast = (message: string, options?: ToastOptions) =>
  createHandler("default")(message, options);

toast.t = createHandler("default", true);
toast.error = createHandler("error");
toast.tError = createHandler("error", true);

export { toast };
