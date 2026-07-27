// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ParseKeys } from "i18next";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

/** Suports regular strings & translation keys. Translation keys will auto-complete. */
export type TranslationKeyOrString = ParseKeys | (string & {});

export function useMaybeT() {
  const { t } = useTranslation();
  return useCallback(
    // @ts-expect-error - If the key doesn't exist, then the string is outputted.
    (keyOrString: TranslationKeyOrString): string => t(keyOrString),
    [t],
  );
}
