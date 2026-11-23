// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Asynchronously pause logic for the specified amount of time. Useful to
 * prevent code blocking due to an async task.
 */
export async function wait(durationMs: number) {
  await new Promise<void>((resolve) => setTimeout(resolve, durationMs));
}
