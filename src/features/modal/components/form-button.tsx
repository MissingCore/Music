import { useBottomSheet } from "@gorhom/bottom-sheet";

import { cn } from "@/lib/style";
import { Button } from "@/components/form/button";

/** @description A form button used in a modal. */
export function ModalFormButton({
  onPress,
  wrapperClassName,
  ...props
}: Button.Props) {
  const { close } = useBottomSheet();

  return (
    <Button
      {...props}
      onPress={(e) => {
        if (onPress) setTimeout(() => onPress(e), 250);
        close();
      }}
      wrapperClassName={cn("px-4 py-1.5", wrapperClassName)}
    />
  );
}
