import AsyncStorage from "@react-native-async-storage/async-storage";
import type { WritableAtom, SetStateAction } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

/** @description Helper for creating an atom with `atomWithStorage`. */
export function createAtomWithStorage<T>(
  key: string,
  initialValue: T,
  /** If we get the item from storage on initialization. */
  getOnInit = true,
) {
  const storage = createJSONStorage<T>(() => AsyncStorage);
  return atomWithStorage<T>(key, initialValue, storage, { getOnInit });
}

/** @description Type of read-write atom. */
export type TAtom<TValue> = WritableAtom<
  TValue | Promise<TValue>,
  [SetStateAction<TValue | Promise<TValue>>],
  Promise<void>
>;

/** @description Type of the function returned from `useSetAtom`. */
export type SetAtom<Args extends any[], Result> = (...args: Args) => Result;
