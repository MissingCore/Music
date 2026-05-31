import { createId } from "@paralleldrive/cuid2";

import { lyricStore } from "./store";
import type { LyricProvider } from "./constants";

export function createLyricProvider(newProvider: Omit<LyricProvider, "id">) {
  lyricStore.setState((prev) => ({
    providers: [...prev.providers, { id: createId(), ...newProvider }],
  }));
}

export function deleteLyricProvider(providerId: string) {
  lyricStore.setState((prev) => ({
    providers: prev.providers.filter((provider) => provider.id !== providerId),
  }));
}

export function updateLyricProvider(
  providerId: string,
  updatedValues: Omit<LyricProvider, "id">,
) {
  lyricStore.setState((prev) => ({
    providers: prev.providers.map((provider) => {
      if (provider.id !== providerId) return provider;
      return { ...provider, ...updatedValues };
    }),
  }));
}

export function toggleLyricVisibility() {
  lyricStore.setState((prev) => ({ visible: !prev.visible }));
}
