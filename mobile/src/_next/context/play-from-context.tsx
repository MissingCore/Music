// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { createContext, use, useMemo } from "react";

import type { PlayFromSource } from "~/_next/constants/media";
import { ReservedNames } from "~/_next/constants/media";

const PlayFromContext = createContext<PlayFromSource>({
  type: "playlist",
  id: ReservedNames.tracks,
});

interface PlayFromProviderProps extends PlayFromSource {
  children: React.ReactNode;
}

export function PlayFromProvider({
  type,
  id,
  children,
}: PlayFromProviderProps) {
  const value = useMemo(() => ({ type, id }), [type, id]);
  return <PlayFromContext value={value}>{children}</PlayFromContext>;
}

//#region Hooks
export function usePlayFromSource() {
  return use(PlayFromContext);
}
//#endregion
