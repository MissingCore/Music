// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import i18next from "~/modules/i18n";

import { ReservedNames } from "~/modules/media/constants";

/**
 * Returns sanitize playlist name after checking to see if it's valid based
 * on other metrics. Throws error on failure.
 */
export function sanitizePlaylistName(name: string) {
  const sanitized = name.trim();

  let errMsg: string | undefined;
  if (ReservedNames.has(sanitized)) errMsg = i18next.t("err.msg.usedName");
  if (sanitized.length === 0) errMsg = i18next.t("err.msg.noContent");

  if (errMsg) throw new Error(errMsg);

  return sanitized;
}
