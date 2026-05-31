import { createId } from "@paralleldrive/cuid2";

import { lyricStore } from "./store";
import type { LyricProvider } from "./constants";

export function createLyricProvider(newProvider: Omit<LyricProvider, "id">) {
  lyricStore.setState((prev) => ({
    providers: [...prev.providers, { id: createId(), ...newProvider }],
  }));
}

export function toggleLyricVisibility() {
  lyricStore.setState((prev) => ({ visible: !prev.visible }));
}
