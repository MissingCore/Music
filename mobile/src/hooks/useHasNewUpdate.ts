import { useLatestRelease } from "~/queries/setting";
import { userPreferencesStore } from "~/services/UserPreferences";

import { APP_VERSION } from "~/constants/Config";

type UpdateResult =
  | { hasNewUpdate: false; release: null; isRC: false }
  | {
      hasNewUpdate: true;
      release: { releaseNotes: string; version: string };
      isRC: boolean;
    };

/** Determines if we have a new update. */
export function useHasNewUpdate(): UpdateResult {
  const { isPending, error, data } = useLatestRelease();
  const { rcNotification } = userPreferencesStore.getState();

  let isRC = false;
  if (isPending || !!error) return { hasNewUpdate: false, release: null, isRC };

  isRC = APP_VERSION.includes("-rc");
  // Release candidates shouldn't have the "Latest Release" tag on GitHub
  // (ie: shouldn't be in `data.latestStable`). We compare against potentially
  // release candidate versions if we're on a release candidate.
  const usedRelease =
    isRC || rcNotification ? data.latestRelease : data.latestStable;

  // Note: We can technically display an older release note if we updated
  // to the lastest version before the GitHub release notes are published.
  if (!usedRelease.version || usedRelease.version === APP_VERSION) {
    return { hasNewUpdate: false, release: null, isRC: false };
  } else {
    return {
      hasNewUpdate: true,
      release: usedRelease,
      isRC: isRC || usedRelease.version.includes("-rc"),
    };
  }
}
