// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import type { Dispatch, SetStateAction } from "react";
import {
  createContext,
  use,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import * as v from "valibot";

import { useTheme } from "~/_next/context/theme-context";
import { useBackHandler } from "~/hooks/useBackHandler";

import { wait } from "~/_next/utils/promise";
import type { IconButtonProps } from "~/_next/components/button-icon";
import { Dialog } from "~/_next/components/dialog";
import { Ripple } from "~/_next/components/ripple";
import { TText } from "~/_next/components/typography";

type FormType = "create" | "edit";

type InitialArguments<TSchema extends v.ObjectSchema<any, any>> = {
  type: FormType;
  schema: TSchema;
  initData: v.InferOutput<TSchema>;
  /** Fields omitted during normal validation. Will be checked in `onSubmit`. */
  omittedFields?: Array<keyof v.InferOutput<TSchema>>;
  onSubmit: (data: v.InferOutput<TSchema>) => void | Promise<void>;

  /** Additional validation to check whether we can submit. */
  onConstraints?: (data: v.InferOutput<TSchema>) => boolean;

  /** Determine if the "Unsaved Changes" prompt can be disabled. Defaults `true`. */
  promptUnsavedChanges?: boolean;
};

type FormState<TData extends Record<string, any>> = {
  type: FormType;
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

const UnsavedChangesContext = createContext<{
  showConfirmation: boolean;
  setShowConfirmation: Dispatch<SetStateAction<boolean>>;
}>(null as never);

//#region Hook
/** Wrap this with another hook to type the return data. */
export function useFormContext<TData extends Record<string, any>>() {
  const context = use(FormStateContext);
  if (!context)
    throw new Error("`useFormContext` must be used in a `FormProvider`.");
  return context as FormState<TData>;
}
//#endregion

//#region Provider
export function FormProvider<TSchema extends v.ObjectSchema<any, any>>(
  props: InitialArguments<TSchema> & { children: React.ReactNode },
) {
  const initData = useRef(props.initData);
  const schemaRef = useRef(props.schema);
  const partialSchemaRef = useRef(
    props.omittedFields
      ? // @ts-expect-error - Keys in `omittedFields` are in schema.
        v.omit(props.schema, props.omittedFields)
      : props.schema,
  );
  const omittedFieldsRef = useRef(props.omittedFields ?? []);
  const onSubmitRef = useRef(props.onSubmit);
  const onConstraintsRef = useRef(props.onConstraints);

  const [data, setData] = useState(props.initData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const setFields: Dispatch<
    | Partial<v.InferOutput<TSchema>>
    | ((prevState: v.InferOutput<TSchema>) => Partial<v.InferOutput<TSchema>>)
  > = useCallback((value) => {
    setData((prevState) => ({
      ...prevState,
      ...(typeof value === "function" ? value(prevState) : value),
    }));
  }, []);

  const hasChanged = useMemo(() => {
    const result = v.safeParse(partialSchemaRef.current, data);
    const safeData = result.success ? result.output : undefined;
    // Use the sanitized fields as much as possible.
    const refData = { ...data, ...(safeData ?? {}) };
    return Object.entries(refData).some(([field, value]) => {
      // Skip check if field is omitted.
      if (omittedFieldsRef.current.includes(field)) return false;

      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
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
      v.safeParse(partialSchemaRef.current, data).success
    );
  }, [data, hasChanged, passedConstraints]);

  const onSubmit = useCallback(async () => {
    if (!canSubmit) return;
    const parsedData = v.safeParse(schemaRef.current, data);
    if (!parsedData.success) return;
    setIsSubmitting(true);
    try {
      // Slight buffer before running heavy async task.
      await wait(1);
      await onSubmitRef.current(parsedData.output);
    } catch {}
    setIsSubmitting(false);
  }, [canSubmit, data]);

  return (
    <FormStateContext
      value={{
        type: props.type,
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
      <UnsavedChangesContext value={{ showConfirmation, setShowConfirmation }}>
        {props.children}
        {(props.promptUnsavedChanges ?? true) ? <UnsavedChangesPrompt /> : null}
      </UnsavedChangesContext>
    </FormStateContext>
  );
}
//#endregion

//#region Actions
/** Returns partial props for an `IconButton` for the "back" action. */
export function useBackAction() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { hasChanged, isSubmitting } = useFormContext();
  const { setShowConfirmation } = use(UnsavedChangesContext);
  return useMemo(
    () =>
      ({
        icon: "close",
        accessibilityLabel: t("form.back"),
        onPress: () => {
          if (hasChanged) return setShowConfirmation(true);
          navigation.goBack();
        },
        disabled: isSubmitting,
      }) satisfies IconButtonProps,
    [t, navigation, hasChanged, isSubmitting, setShowConfirmation],
  );
}

/** Returns partial props for an `IconButton` for the "submit" action. */
export function useSubmitAction() {
  const { t } = useTranslation();
  const { canSubmit, onSubmit, isSubmitting } = useFormContext();
  return useMemo(
    () =>
      ({
        icon: "check",
        accessibilityLabel: t("form.apply"),
        onPress: onSubmit,
        disabled: !canSubmit || isSubmitting,
      }) satisfies IconButtonProps,
    [t, canSubmit, onSubmit, isSubmitting],
  );
}
//#endregion

//#region Internal
function UnsavedChangesPrompt() {
  const navigation = useNavigation();
  const { text } = useTheme().colors;
  const { hasChanged, isSubmitting } = useFormContext();
  const { showConfirmation, setShowConfirmation } = use(UnsavedChangesContext);

  useBackHandler(() => {
    if (!hasChanged) return false;
    if (!isSubmitting) setShowConfirmation(true);
    return true;
  }, [hasChanged, isSubmitting]);

  return (
    <Dialog
      visible={showConfirmation}
      onClose={() => setShowConfirmation(false)}
    >
      <TText textKey="form.unsaved" style={{ fontSize: 18 }} />
      <View className="flex-row items-center gap-2">
        <Ripple className="flex-1 rounded-full p-4">
          <TText
            textKey="form.leave"
            onPress={() => {
              navigation.goBack();
              setShowConfirmation(false);
            }}
          />
        </Ripple>
        <Ripple
          color="text"
          style={{ backgroundColor: text }}
          className="flex-1 rounded-full p-4"
        >
          <TText
            textKey="form.stay"
            onPress={() => setShowConfirmation(false)}
            color="background"
          />
        </Ripple>
      </View>
    </Dialog>
  );
}
//#endregion
