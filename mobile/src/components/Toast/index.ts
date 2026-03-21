import { createId } from "@paralleldrive/cuid2";
import type { ParseKeys } from "i18next";

import i18next from "~/modules/i18n";
import { toastStore } from "./store";
import type { ToastType } from "./types";

type ToastHandler<T extends boolean> = (
  message: T extends true ? ParseKeys : string,
  autoDismiss?: boolean,
) => void;

function createHandler<T extends boolean>(
  type: ToastType,
  i18n?: T,
): ToastHandler<T> {
  return (msg, autoDismiss = true) => {
    const message = i18n ? i18next.t(msg as ParseKeys) : msg;
    const newToast = { id: createId(), type, message, autoDismiss };
    toastStore.setState((prev) => ({ toasts: [...prev.toasts, newToast] }));
  };
}

const toast = (message: string, autoDismiss = true) =>
  createHandler("default")(message, autoDismiss);

toast.t = createHandler("default", true);
toast.error = createHandler("error");
toast.tError = createHandler("error", true);

export { toast };
