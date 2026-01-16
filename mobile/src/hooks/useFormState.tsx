import { useNavigation } from "@react-navigation/native";
import type { Dispatch, SetStateAction } from "react";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { BackHandler } from "react-native";
import type { ZodMiniObject, z } from "zod/mini";

import { Check } from "~/resources/icons/Check";

import { ScreenOptions } from "~/navigation/components/ScreenOptions";

import { wait } from "~/utils/promise";
import { isNumber, isString } from "~/utils/validation";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import { ModalTemplate } from "~/components/Modal";

type InitialArguments<TSchema extends ZodMiniObject> = {
  schema: TSchema;
  initData: z.infer<TSchema>;
  onSubmit: (data: z.infer<TSchema>) => void | Promise<void>;

  /** Additional validation to check whether we can submit. */
  onConstraints?: (data: z.infer<TSchema>) => boolean;
};

type FormState<TData extends Record<string, any>> = {
  data: TData;
  setField: Dispatch<SetStateAction<TData>>;

  hasChanged: boolean;
  canSubmit: boolean;
  onSubmit: () => Promise<void>;

  isSubmitting: boolean;
  setIsSubmitting: Dispatch<SetStateAction<boolean>>;
};

const FormStateContext = createContext<FormState<any>>(null as never);

//#region Provider
/** Handles data validation, back prevention, and more. */
export function FormStateProvider<TSchema extends ZodMiniObject>(
  props: InitialArguments<TSchema> & { children: React.ReactNode },
) {
  const initData = useRef(props.initData);
  const schemaRef = useRef(props.schema);
  const onSubmitRef = useRef(props.onSubmit);
  const onConstraintsRef = useRef(props.onConstraints);

  const [data, setData] = useState(props.initData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasChanged = useMemo(() => {
    const safeData = schemaRef.current.safeParse(data).data;
    // Use the sanitized fields as much as possible.
    const refData = { ...data, ...(safeData ?? {}) };
    return Object.entries(refData).some(([field, value]) => {
      if (isString(value) || isNumber(value) || value === null) {
        return initData.current[field] !== value;
      } else if (Array.isArray(value)) {
        // FIXME: We need to better handle arrays of any type.
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
      }}
    >
      <TopAppBar />
      {props.children}
      <UnsavedChangesPrompt />
    </FormStateContext>
  );
}
//#endregion

//#region Hook
/** Wrap this with another hook to type the return data. */
export function useFormStateContext<TData extends Record<string, any>>() {
  const context = use(FormStateContext);
  if (!context)
    throw new Error(
      "`useFormStateContext` must be used in a `FormStateProvider`.",
    );
  return context as FormState<TData>;
}
//#endregion

//#region Internal
function TopAppBar() {
  const { t } = useTranslation();
  const { canSubmit, isSubmitting, onSubmit } = useFormStateContext();
  return (
    <ScreenOptions
      // Hacky solution to disable the back button when submitting.
      headerLeft={isSubmitting ? () => undefined : undefined}
      headerRight={() => (
        <FilledIconButton
          Icon={Check}
          accessibilityLabel={t("form.apply")}
          onPress={onSubmit}
          disabled={!canSubmit || isSubmitting}
          size="sm"
        />
      )}
    />
  );
}

function UnsavedChangesPrompt() {
  const navigation = useNavigation();
  const { hasChanged, isSubmitting } = useFormStateContext();
  const [showConfirmation, setShowConfirmation] = useState(false);

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
    <ModalTemplate
      visible={showConfirmation}
      titleKey="form.unsaved"
      topAction={{
        textKey: "form.leave",
        onPress: () => navigation.goBack(),
      }}
      bottomAction={{
        textKey: "form.stay",
        onPress: () => setShowConfirmation(false),
      }}
    />
  );
}
//#endregion
