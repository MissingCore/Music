import { trackMultiSelectStore } from "./store";

export function enableTrackMultiSelect() {
  trackMultiSelectStore.setState({ enabled: true });
}

export function resetTrackMultiSelect() {
  trackMultiSelectStore.setState({ enabled: false, selected: new Set() });
}

export function toggleTrackSelection(id: string) {
  trackMultiSelectStore.setState((prev) => {
    const updatedSet = new Set(prev.selected);
    if (updatedSet.has(id)) updatedSet.delete(id);
    else updatedSet.add(id);
    return { selected: updatedSet };
  });
}
