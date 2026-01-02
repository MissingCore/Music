import { useCallback, useMemo, useRef, useState } from "react";
import type { ZodMiniObject, ZodMiniType, z } from "zod/mini";

import { isNumber, isString } from "~/utils/validation";

type UseFormStateArgs<TSchema extends ZodMiniType> = {
  schema: TSchema;
  initData: z.infer<TSchema>;

  /** Additional validation to check whether we can submit. */
  onConstraints?: (data: z.infer<TSchema>) => boolean;
};

export function useFormState<
  TSchema extends ZodMiniObject,
  TData extends z.infer<TSchema>,
>(args: UseFormStateArgs<TSchema>) {
  const schemaRef = useRef(args.schema);
  const onConstraintsRef = useRef(args.onConstraints);

  const initData = useRef(args.initData);
  const [data, setData] = useState(args.initData);

  const hasChanged = useMemo(() => {
    const safeData = schemaRef.current.safeParse(data).data;
    // Use the sanitized fields as much as possible.
    const refData = { ...data, ...(safeData ?? {}) };
    return Object.entries(refData).some(([field, value]) => {
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
    return hasChanged && addCheck && schemaRef.current.safeParse(data).success;
  }, [data, hasChanged]);

  const setField = useCallback(
    <TKey extends keyof TData>(field: TKey, value: TData[TKey]) => {
      setData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const setFields = useCallback((data: Partial<TData>) => {
    setData((prev) => ({ ...prev, ...data }));
  }, []);

  return { data, hasChanged, canSubmit, setField, setFields };
}
