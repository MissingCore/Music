import { useCallback, useMemo, useRef, useState } from "react";

import { wait } from "~/utils/promise";

/** Utilize if our form is a single input. */
export function useInputForm(args: {
  onSubmit: (trimmedValue: string) => void | Promise<void>;
  onError?: (trimmedValue: string) => void;
  /** Additional validation to check whether we can submit. */
  onConstraints?: (trimmedValue: string) => boolean;
}) {
  const onConstraintsRef = useRef(args.onConstraints);
  onConstraintsRef.current = args.onConstraints;
  const onSubmitRef = useRef(args.onSubmit);
  onSubmitRef.current = args.onSubmit;
  const onErrorRef = useRef(args.onError);
  onErrorRef.current = args.onError;

  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    const trimmedValue = value.trim();
    let additionalCheck = true;
    if (onConstraintsRef.current)
      additionalCheck = onConstraintsRef.current(trimmedValue);
    return !!trimmedValue && additionalCheck;
  }, [value]);

  const onSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      await wait(1); // Slight bufffer to let state updates run.
      await onSubmitRef.current(value.trim());
      setValue("");
    } catch {
      if (onErrorRef.current) onErrorRef.current(value.trim());
    }

    setIsSubmitting(false);
  }, [value, canSubmit]);

  return useMemo(
    () => ({ value, onChange: setValue, canSubmit, isSubmitting, onSubmit }),
    [value, canSubmit, isSubmitting, onSubmit],
  );
}
