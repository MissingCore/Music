# @missingcore/ui

A module containing minimally styled, reusable UI elements that are generic enough to be copied into other projects.

We require the following peer dependencies:

- `react-native-gesture-handler >= 3`
- `react-native-reanimated >= 4`
- `react-native-worklets`
- `zustand >= 5`

Additional dependencies may be required based on the module you copy.

## Exported Modules

### `@missingcore/ui/drag-list`

A drag list component built off of LegendList, offering the best performance for large lists compared to other drag list alternatives, which use FlatList.

Besides the other required dependencies mentioned, we also need:

- `@legendapp/list >= 3`
- `uniwind`

> [!NOTE]
> `uniwind` is optional. If you don't use it, replace the `WrappedAnimatedLegendList` with the regular `AnimatedLegendList`.

#### Exported Values

- `<DragList />`: Self-explanatory.
- `useDragListState()`: Get the current state of the Drag List in an item (`isDragging`, `isActive`) and a function to initiate drag.
- `DragListRenderItemInfo`: Data passed to `renderItem`.

### `@missingcore/ui/toast`

Display a toast message at the top of the screen. Supports 2 variants (normal & error) and translations (via `i18next`).

Besides the other required dependencies mentioned, we also need:

- `i18next`
- `react-native-safe-area-context`

#### Exported Values

- `<Toaster />`: Where in the React Tree the toasts will render from.
- `toast()`: Used to create toasts.
