import type { Dispatch, SetStateAction } from "react";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BackHandler } from "react-native";
import type { ZodMiniObject, z } from "zod/mini";

import { wait } from "~/utils/promise";
import { isNumber, isString } from "~/utils/validation";

type InitialArguments<TSchema extends ZodMiniObject> = {
  schema: TSchema;
  initData: z.infer<TSchema>;
  onSubmit: (data: z.infer<TSchema>) => void | Promise<void>;

  /** Additional validation to check whether we can submit. */
  onConstraints?: (data: z.infer<TSchema>) => boolean;
};

export type FormState<TData extends Record<string, any>> = {
  data: TData;
  setField: Dispatch<SetStateAction<TData>>;

  hasChanged: boolean;
  canSubmit: boolean;
  onSubmit: () => Promise<void>;

  isSubmitting: boolean;
  setIsSubmitting: Dispatch<SetStateAction<boolean>>;
  showConfirmation: boolean;
  setShowConfirmation: Dispatch<SetStateAction<boolean>>;
};

export const FormStateContext = createContext<FormState<any>>(null as never);

export function FormStateProvider<TSchema extends ZodMiniObject>(
  props: InitialArguments<TSchema> & { children: React.ReactNode },
) {
  const schemaRef = useRef(props.schema);
  const onSubmitRef = useRef(props.onSubmit);
  const onConstraintsRef = useRef(props.onConstraints);

  const initData = useRef(props.initData);
  const [data, setData] = useState(props.initData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

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

  const onSubmit = useCallback(async () => {
    if (!canSubmit) return;
    const parsedData = schemaRef.current.safeParse(data);
    if (!parsedData.data) return;
    setIsSubmitting(true);
    // Slight buffer before running heavy async task.
    await wait(1);
    await onSubmitRef.current(parsedData.data);
    setIsSubmitting(false);
  }, [canSubmit, data]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (!hasChanged) return false;
        if (!isSubmitting) setShowConfirmation(true);
        return true;
      },
    );
    return () => subscription.remove();
  }, [hasChanged, isSubmitting]);

  return (
    <FormStateContext
      value={{
        data,
        setField: setData,
        hasChanged,
        canSubmit,
        onSubmit,
        isSubmitting,
        setIsSubmitting,
        showConfirmation,
        setShowConfirmation,
      }}
    >
      {props.children}
    </FormStateContext>
  );
}
