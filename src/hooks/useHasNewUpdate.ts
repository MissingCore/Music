import { useLatestRelease } from "@/api/releases";

import { APP_VERSION } from "@/constants/Config";

/** @description Returns a boolean on whether we have a new update. */
export function useHasNewUpdate() {
  const { isPending, error, data } = useLatestRelease();

  if (isPending) {
    return false;
  } else if (
    !!error ||
    !data.version ||
    data.version.includes("-rc.") ||
    data.version < APP_VERSION.split("-rc.")[0]
  ) {
    // We prefer newest stable version over release candidate (ie: `v1.0.0` over `v1.0.0-rc.1`)
    //  - `data.version` should never be a release candidate value.
    return false;
  } else {
    return true;
  }
}
