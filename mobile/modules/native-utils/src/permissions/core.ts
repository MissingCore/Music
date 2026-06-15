import { useCallback, useEffect, useState } from "react";
import type { Permission } from "react-native";
import { PermissionsAndroid } from "react-native";

import type { PermissionResponse } from "./types";

const INITIAL_PERMISSION_RESPONSE: PermissionResponse = {
  status: "undetermined",
  canAskAgain: true,
};

/** Factory function to generate a hook to ask for permissions. */
export function createPermissionRequestHook(permission: Permission) {
  return function usePermission(): [
    PermissionResponse | null,
    () => Promise<PermissionResponse>,
  ] {
    const [permissionResponse, setPermissionResponse] =
      useState<PermissionResponse | null>(null);

    const checkPermissionStatus = useCallback(async () => {
      const hasPermission = await PermissionsAndroid.check(permission);
      const response: PermissionResponse = {
        status: hasPermission ? "granted" : "denied",
        canAskAgain: true,
      };
      setPermissionResponse(response);
      return response;
    }, []);

    const requestPermission = useCallback(async () => {
      const result = await PermissionsAndroid.request(permission);
      const response: PermissionResponse = {
        status:
          result === PermissionsAndroid.RESULTS.GRANTED ? "granted" : "denied",
        canAskAgain: result !== PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
      };
      setPermissionResponse(response);
      return response;
    }, []);

    useEffect(() => {
      checkPermissionStatus().catch(() => {
        setPermissionResponse(INITIAL_PERMISSION_RESPONSE);
      });
    }, [checkPermissionStatus]);

    return [permissionResponse, requestPermission];
  };
}
