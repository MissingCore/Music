// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

export class BoundedMap<K, V> extends Map<K, V> {
  private readonly maxSize: number;

  constructor(maxSize: number, entries?: Iterable<readonly [K, V]> | null) {
    super();
    if (!Number.isInteger(maxSize) || maxSize < 1) {
      throw new RangeError("`maxSize` must be a positive integer.");
    }

    this.maxSize = maxSize;
    if (entries) {
      for (const [key, value] of entries) this.set(key, value);
    }
  }

  override set(key: K, value: V): this {
    if (!this.has(key) && this.size >= this.maxSize) {
      const oldestEntry = this.keys().next();
      if (!oldestEntry.done) this.delete(oldestEntry.value);
    }

    return super.set(key, value);
  }
}
