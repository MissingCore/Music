// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ParseKeys, TOptions } from "i18next";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

/**
 * Suports regular strings & translation keys. Translation keys will auto-complete.
 *
 * To check for removed translation keys, we can temporarily remove `string & {}`
 * and then run the typecheck script.
 */
export type TranslationKeyOrString = ParseKeys | (string & {});

export function useMaybeT() {
  const { t } = useTranslation();
  return useCallback(
    (keyOrString: TranslationKeyOrString, options?: TOptions): string =>
      // @ts-expect-error - If the key doesn't exist, then the string is outputted.
      t(keyOrString, options),
    [t],
  );
}
