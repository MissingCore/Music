import { I18nManager } from "react-native";

export const OnRTL = {
  _use<T>(val: T) {
    if (I18nManager.isRTL) return val;
  },

  decide<T, U>(valIfTrue: T, valIfFalse: U) {
    return I18nManager.isRTL ? valIfTrue : valIfFalse;
  },
};

export const OnRTLWorklet = {
  decide<T, U>(valIfTrue: T, valIfFalse: U) {
    "worklet";
    return I18nManager.isRTL ? valIfTrue : valIfFalse;
  },

  flipSign: (num: number) => {
    "worklet";
    return (I18nManager.isRTL ? -1 : 1) * num;
  },
};
