import { router } from "expo-router";
import { useEffect } from "react";

/** Navigate back when rendered. */
export function Back() {
  useEffect(() => {
    router.back();
  }, []);

  return null;
}
