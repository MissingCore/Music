import { useEffect, useState } from "react";
import { View } from "react-native";

import { Colors } from "@/constants/Styles";

const { neutral10, neutral40, neutral80 } = Colors;

/** Nothing loading animation. */
export function Loading() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIdx((prev) => (prev + 1) % 3);
    }, 250);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <View className="w-full flex-row justify-center gap-3">
      <View
        style={{
          backgroundColor:
            idx === 0 ? neutral80 : idx === 1 ? neutral40 : neutral10,
        }}
        className="size-4 rounded-full"
      />
      <View
        style={{ backgroundColor: idx === 1 ? neutral80 : neutral40 }}
        className="size-4 rounded-full"
      />
      <View
        style={{ backgroundColor: idx === 2 ? neutral80 : neutral10 }}
        className="size-4 rounded-full"
      />
    </View>
  );
}
