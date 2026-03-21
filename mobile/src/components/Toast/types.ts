export type Toast = {
  id: string;
  type?: "default" | "error";
  message: string;
  /**
   * Defaults `true`. If `false`, toast won't auto-dismiss until another
   * toast is queued.
   */
  autoDismiss?: boolean;
};
