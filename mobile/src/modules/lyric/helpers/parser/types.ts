// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

export type SynchronizedWord = { startMS: number; content: string };

export type SynchronizedLine = { startMS: number; content: SynchronizedWord[] };
