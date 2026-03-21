export type ToastType = "default" | "error";

export type Toast = {
  id: string;
  type?: ToastType;
  message: string;
  /**
   * Defaults `true`. If `false`, toast won't auto-dismiss until another
   * toast is queued.
   */
  autoDismiss?: boolean;
};
