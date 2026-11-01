// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { preferenceStore, usePreferenceStore } from "~/stores/Preference/store";

import type { SheetRef } from "~/components/next/base/sheet";
import { RadioSheet } from "~/components/next/composed/sheet-radio";

export function DefaultOpenTabSheet(props: { ref: SheetRef }) {
  const { t } = useTranslation();
  const defaultOpenTab = usePreferenceStore((s) => s.defaultOpenTab);

  const options = useMemo(
    () => [
      { type: "home", label: t("term.home") } as const,
      { type: "library", label: t("term.library") } as const,
    ],
    [t],
  );

  return (
    <RadioSheet
      ref={props.ref}
      data={options}
      onSelect={({ type }) =>
        preferenceStore.setState({ defaultOpenTab: type })
      }
      isSelected={(item) => item.type === defaultOpenTab}
    />
  );
}

export function DefaultLibraryTabSheet(props: { ref: SheetRef }) {
  const { t } = useTranslation();
  const defaultLibraryTab = usePreferenceStore((s) => s.defaultLibraryTab);

  const options = useMemo(
    () => [
      { type: "album", label: t("term.albums") } as const,
      { type: "artist", label: t("term.artists") } as const,
      { type: "folder", label: t("term.folders") } as const,
      { type: "genre", label: t("term.genres") } as const,
      { type: "playlist", label: t("term.playlists") } as const,
      { type: "track", label: t("term.tracks") } as const,
    ],
    [t],
  );

  return (
    <RadioSheet
      ref={props.ref}
      data={options}
      onSelect={({ type }) =>
        preferenceStore.setState({ defaultLibraryTab: type })
      }
      isSelected={(item) => item.type === defaultLibraryTab}
    />
  );
}
