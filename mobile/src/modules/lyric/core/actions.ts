import { lyricStore } from "./store";

export function toggleLyricVisibility() {
  lyricStore.setState((prev) => ({ visible: !prev.visible }));
}
