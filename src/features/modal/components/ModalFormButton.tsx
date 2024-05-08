import { useBottomSheet } from "@gorhom/bottom-sheet";
import { forwardRef } from "react";
import type { View } from "react-native";

import type { ButtonProps } from "@/components/ui/Button";
import { Button } from "@/components/ui/Button";

/** @description A form button used in a modal. */
export const ModalFormButton = forwardRef<View, ButtonProps>(
  ({ onPress, ...props }, ref) => {
    const { close } = useBottomSheet();

    return (
      <Button
        ref={ref}
        {...props}
        onPress={(e) => {
          if (onPress) onPress(e);
          close();
        }}
      />
    );
  },
);
