import { router } from "expo-router";
import { useEffect } from "react";

/** @description Navigate back when rendered. */
export function Back() {
  useEffect(() => {
    router.back();
  }, []);

  return null;
}
