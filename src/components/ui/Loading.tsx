import { useState, useEffect } from "react";
import { Svg, Circle } from "react-native-svg";

import { Colors } from "@/constants/Styles";

/** @description Nothing loading animation. */
export function Loading() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % 3);
    }, 250);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <Svg width={80} height={20} viewBox="0 0 96 20" className="mx-auto">
      <Circle
        cx="10"
        cy="10"
        r="10"
        fill={
          activeIdx === 0
            ? Colors.surface50
            : activeIdx === 1
              ? Colors.surface400
              : Colors.surface700
        }
      />
      <Circle
        cx="40"
        cy="10"
        r="10"
        fill={activeIdx === 1 ? Colors.surface50 : Colors.surface400}
      />
      <Circle
        cx="70"
        cy="10"
        r="10"
        fill={activeIdx === 2 ? Colors.surface50 : Colors.surface700}
      />
    </Svg>
  );
}
