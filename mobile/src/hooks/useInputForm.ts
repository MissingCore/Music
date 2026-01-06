import { useCallback, useMemo, useRef, useState } from "react";

import { wait } from "~/utils/promise";

/** Utilize if our form is a single input. */
export function useInputForm(args: {
  onSubmit: (trimmedValue: string) => void | Promise<void>;
  onError?: (value: string) => void;
  /** Additional validation to check whether we can submit. */
  onConstraints?: (value: string) => boolean;
}) {
  const onConstraintsRef = useRef(args.onConstraints);
  onConstraintsRef.current = args.onConstraints;
  const onSubmitRef = useRef(args.onSubmit);
  onSubmitRef.current = args.onSubmit;
  onConstraintsRef.current = args.onConstraints;
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
      await onSubmitRef.current(value);
      setValue("");
    } catch {
      if (onErrorRef.current) onErrorRef.current(value);
    }

    setIsSubmitting(false);
  }, [value, canSubmit]);

  return useMemo(
    () => ({
      value,
      onChange: (text: string) => setValue(text),
      canSubmit,
      isSubmitting,
      onSubmit,
    }),
    [value, canSubmit, isSubmitting, onSubmit],
  );
}
