import { useNavigation } from "@react-navigation/native";
import type { ParseKeys } from "i18next";
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
import { BackHandler, View } from "react-native";
import type { ZodMiniObject } from "zod/mini";
import { z } from "zod/mini";

import { Check } from "~/resources/icons/Check";

import { ScreenOptions } from "~/navigation/components/ScreenOptions";
import type { useFloatingContent } from "~/navigation/hooks/useFloatingContent";

import { wait } from "~/utils/promise";
import { isBoolean, isNumber, isString } from "~/utils/validation";
import { ExtendedTButton } from "~/components/Form/Button";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import { ModalTemplate } from "~/components/Modal";

type InitialArguments<TSchema extends ZodMiniObject> = {
  schema: TSchema;
  initData: z.infer<TSchema>;
  /** Fields omitted during normal validation. Will be checked in `onSubmit`. */
  omittedFields?: Array<keyof z.infer<TSchema>>;
  onSubmit: (data: z.infer<TSchema>) => void | Promise<void>;

  /** Additional validation to check whether we can submit. */
  onConstraints?: (data: z.infer<TSchema>) => boolean;
};

type FormState<TData extends Record<string, any>> = {
  data: TData;
  /** @deprecated For internal use. Use `setFields` instead. */
  setField: Dispatch<SetStateAction<TData>>;
  /** Partially update some fields in `data`. Under the hood, the previous state is spread. */
  setFields: Dispatch<Partial<TData> | ((prevState: TData) => Partial<TData>)>;

  hasChanged: boolean;
  passedConstraints: boolean;
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
  const partialSchemaRef = useRef(
    props.omittedFields
      ? z.omit(
          props.schema,
          // @ts-expect-error - Created object will omit keys in schema.
          Object.fromEntries(props.omittedFields.map((key) => [key, true])),
        )
      : props.schema,
  );
  const omittedFieldsRef = useRef(props.omittedFields ?? []);
  const onSubmitRef = useRef(props.onSubmit);
  const onConstraintsRef = useRef(props.onConstraints);

  const [data, setData] = useState(props.initData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setFields: Dispatch<
    | Partial<z.infer<TSchema>>
    | ((prevState: z.infer<TSchema>) => Partial<z.infer<TSchema>>)
  > = useCallback((value) => {
    setData((prevState) => ({
      ...prevState,
      ...(typeof value === "function" ? value(prevState) : value),
    }));
  }, []);

  const hasChanged = useMemo(() => {
    const safeData = partialSchemaRef.current.safeParse(data).data;
    // Use the sanitized fields as much as possible.
    const refData = { ...data, ...(safeData ?? {}) };
    return Object.entries(refData).some(([field, value]) => {
      // Skip check if field is omitted.
      if (omittedFieldsRef.current.includes(field)) return false;

      if (
        isString(value) ||
        isNumber(value) ||
        isBoolean(value) ||
        value === null
      ) {
        return initData.current[field] !== value;
      } else if (Array.isArray(value)) {
        // FIXME: We need to better handle arrays of any type.
        const fieldData = initData.current[field] as any[];
        return (
          fieldData.length !== value.length ||
          //? Order matters.
          fieldData.some((val, index) => val !== value[index])
        );
      }
      console.warn(
        `\`useForm\` doesn't support (${typeof value}) type values found in \`${field}\`.`,
      );
      return false;
    });
  }, [data]);

  const passedConstraints = useMemo(() => {
    if (!onConstraintsRef.current) return true;
    return onConstraintsRef.current(data);
  }, [data]);

  const canSubmit = useMemo(() => {
    return (
      hasChanged &&
      passedConstraints &&
      partialSchemaRef.current.safeParse(data).success
    );
  }, [data, hasChanged, passedConstraints]);

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
        setFields,
        hasChanged,
        passedConstraints,
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

//#region FAB Workflow
export type FABWorkflowConfig<TData extends Record<string, any>> = {
  label: ParseKeys;
  action: (
    context: Pick<FormState<TData>, "setFields">,
  ) => void | Promise<void>;
  /** If the action that will be done is dangerous/destructive. Will require confirmation to fire `action`. */
  danger?: boolean;
};

/** Additional action that can be displayed in the form. */
export function FABWorkflow(
  props: FABWorkflowConfig<any> &
    Omit<ReturnType<typeof useFloatingContent>, "offset">,
) {
  const [lastChance, setLastChance] = useState(false);
  const { setFields, isSubmitting, setIsSubmitting } = useFormStateContext();

  const triggerAction = async () => {
    if (props.danger) setLastChance(false);
    setIsSubmitting(true);
    await props.action({ setFields });
    setIsSubmitting(false);
  };

  return (
    <>
      <View {...props.floatingContentProps}>
        <ExtendedTButton
          textKey={props.label}
          onPress={() => (props.danger ? setLastChance(true) : triggerAction())}
          disabled={lastChance || isSubmitting}
          className={
            props.danger
              ? "bg-error active:bg-errorDim"
              : "bg-secondary active:bg-secondaryDim"
          }
          textClassName={props.danger ? "text-onError" : "text-onSecondary"}
        />
      </View>
      {props.danger ? (
        <ModalTemplate
          visible={lastChance}
          titleKey={props.label}
          topAction={{
            textKey: "form.confirm",
            onPress: triggerAction,
          }}
          bottomAction={{
            textKey: "form.cancel",
            onPress: () => setLastChance(false),
          }}
        />
      ) : null}
    </>
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
