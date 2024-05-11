import { useBottomSheet } from "@gorhom/bottom-sheet";

import type { ButtonProps } from "@/components/form/Button";
import { Button } from "@/components/form/Button";

/** @description A form button used in a modal. */
export function ModalFormButton({ onPress, ...props }: ButtonProps) {
  const { close } = useBottomSheet();

  return (
    <Button
      {...props}
      onPress={(e) => {
        if (onPress) onPress(e);
        close();
      }}
    />
  );
}
