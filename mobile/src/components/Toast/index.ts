import { createId } from "@paralleldrive/cuid2";
import type { ParseKeys } from "i18next";

import i18next from "~/modules/i18n";
import { toastStore } from "./store";

const Toast = {
  success: (message: string, autoDismiss = true) => {
    const newToast = { id: createId(), message, autoDismiss };
    toastStore.setState((prev) => ({ toasts: [...prev.toasts, newToast] }));
  },
  tSuccess: (message: ParseKeys, autoDismiss = true) => {
    toastStore.setState((prev) => ({
      toasts: [
        ...prev.toasts,
        { id: createId(), message: i18next.t(message), autoDismiss },
      ],
    }));
  },

  error: (message: string, autoDismiss = true) => {
    toastStore.setState((prev) => ({
      toasts: [
        ...prev.toasts,
        { id: createId(), type: "error", message, autoDismiss },
      ],
    }));
  },
  tError: (message: ParseKeys, autoDismiss = true) => {
    toastStore.setState((prev) => ({
      toasts: [
        ...prev.toasts,
        {
          id: createId(),
          type: "error",
          message: i18next.t(message),
          autoDismiss,
        },
      ],
    }));
  },
};

export default Toast;
