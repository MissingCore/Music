import { useBottomSheet } from "@gorhom/bottom-sheet";

import { cn } from "@/lib/style";
import type { ButtonProps } from "@/components/form/Button";
import { Button } from "@/components/form/Button";

/** @description A form button used in a modal. */
export function ModalFormButton({
  onPress,
  wrapperClassName,
  ...props
}: ButtonProps) {
  const { close } = useBottomSheet();

  return (
    <Button
      {...props}
      onPress={(e) => {
        if (onPress) onPress(e);
        close();
      }}
      wrapperClassName={cn("px-4 py-1.5", wrapperClassName)}
    />
  );
}
