import type { ParseKeys } from "i18next";

import i18next from "~/modules/i18n";
import { toastStore } from "./store";

const Toast = {
  success: (message: string, autoDismiss = true) => {
    const newToast = { message, autoDismiss };
    toastStore.setState((prev) => ({ toasts: [...prev.toasts, newToast] }));
  },
  tSuccess: (message: ParseKeys, autoDismiss = true) => {
    const newToast = { message: i18next.t(message), autoDismiss };
    toastStore.setState((prev) => ({ toasts: [...prev.toasts, newToast] }));
  },

  error: (message: string, autoDismiss = true) => {
    const newToast = { type: "error", message, autoDismiss } as const;
    toastStore.setState((prev) => ({ toasts: [...prev.toasts, newToast] }));
  },
  tError: (message: ParseKeys, autoDismiss = true) => {
    toastStore.setState((prev) => ({
      toasts: [
        ...prev.toasts,
        { type: "error", message: i18next.t(message), autoDismiss },
      ],
    }));
  },
};

export default Toast;
