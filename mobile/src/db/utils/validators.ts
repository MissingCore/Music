import i18next from "@/modules/i18n";

import { ReservedNames } from "@/modules/media/constants";

/**
 * Sanitize playlist name and make sure it meets the minimum requirements.
 * Throws error on failure.
 */
export function sanitizedPlaylistName(name: string) {
  const sanitized = name.trim();

  if (ReservedNames.has(sanitized)) {
    throw new Error(i18next.t("response.usedName"));
  }

  return sanitized;
}
