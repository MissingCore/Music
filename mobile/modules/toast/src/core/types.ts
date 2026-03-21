export type ToastType = "default" | "error";

export interface Toast {
  id: string;
  type?: ToastType;
  message: string;
  /**
   * Defaults `true`. If `false`, toast won't auto-dismiss until another
   * toast is queued.
   */
  autoDismiss?: boolean;
}

export type ToastOptions = Partial<Pick<Toast, "autoDismiss">>;

export type ToastTheme = Record<
  "surface" | "onSurface" | "surfaceBorder" | "error" | "onError",
  `#${string}`
> & { fontFamily: string };
