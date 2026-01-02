import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackHandler } from "react-native";
import type { ZodMiniObject, ZodMiniType, z } from "zod/mini";

import { isNumber, isString } from "~/utils/validation";

type UseFormArgs<TSchema extends ZodMiniType> = {
  schema: TSchema;
  initData: z.infer<TSchema>;
  onSubmit: (data: z.infer<TSchema>) => void | Promise<void>;
  /** Callback fired when we block a back gesture. */
  onBlockBack: VoidFunction;

  /** Additional validation to check whether we can submit. */
  onConstraints?: (data: z.infer<TSchema>) => boolean;
};

export function useForm<
  TSchema extends ZodMiniObject,
  TData extends z.infer<TSchema>,
>(args: UseFormArgs<TSchema>) {
  const onConstraintsRef = useRef(args.onConstraints);
  const onSubmitRef = useRef(args.onSubmit);
  const onBlockBackRef = useRef(args.onBlockBack);

  const initData = useRef(args.initData);
  const [data, setData] = useState(args.initData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasChanged = useMemo(() => {
    return Object.entries(data).some(([field, value]) => {
      if (isString(value) || isNumber(value) || value === null) {
        return initData.current[field] !== value;
      } else if (Array.isArray(value)) {
        const fieldData = initData.current[field] as any[];
        return (
          fieldData.length !== value.length ||
          fieldData.some((val) => !value.includes(val))
        );
      }
      console.warn(
        `\`useForm\` doesn't support the type of value in \`${field}\`.`,
      );
      return false;
    });
  }, [data]);

  const canSubmit = useMemo(() => {
    let addCheck = true;
    if (onConstraintsRef.current) addCheck = onConstraintsRef.current(data);
    return hasChanged && addCheck;
  }, [data, hasChanged]);

  const setField = useCallback(<TKey extends keyof TData>(field: TKey) => {
    return (value: TData[TKey]) => {
      setData((prev) => ({ ...prev, [field]: value }));
    };
  }, []);

  const setFields = useCallback((data: Partial<TData>) => {
    setData((prev) => ({ ...prev, ...data }));
  }, []);

  const onSubmit = useCallback(() => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    onSubmitRef.current(data);
  }, [canSubmit, data]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (!hasChanged) return false;
        if (!isSubmitting) onBlockBackRef.current();
        return true;
      },
    );
    return () => subscription.remove();
  }, [hasChanged, isSubmitting]);

  return {
    data,
    hasChanged,
    canSubmit,
    isSubmitting,
    setField,
    setFields,
    onSubmit,
  };
}
