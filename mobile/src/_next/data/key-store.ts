// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

export const q = {
  artist: {
    all: ["artist"] as const,
    detail: (id: string) => [...q.artist.all, id] as const,
  },
  genre: {
    all: ["genre"] as const,
    detail: (id: string) => [...q.genre.all, id] as const,
  },
};
