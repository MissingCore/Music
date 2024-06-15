import { useLatestRelease } from "@/features/setting/api/release";

import { APP_VERSION } from "@/constants/Config";

/** @description Returns a boolean on whether we have a new update. */
export function useHasNewUpdate() {
  const { isPending, error, data } = useLatestRelease();

  if (isPending || !!error) return false;

  const usingRC = APP_VERSION.includes("-rc");
  // Release candidates shouldn't have the "Latest Release" tag on GitHub
  // (ie: shouldn't be in `data.latestStable`). We compare against potentially
  // release candidate versions if we're on a release candidate.
  const usedRelease = usingRC ? data.latestRelease : data.latestStable;

  if (!usedRelease.version || usedRelease.version === APP_VERSION) return false;
  else return true;
}
