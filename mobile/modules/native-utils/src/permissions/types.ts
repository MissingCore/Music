export type PermissionStatus = "granted" | "denied" | "undetermined";

export type PermissionResponse = {
  status: PermissionStatus;
  canAskAgain: boolean;
};
