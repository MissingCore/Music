// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useIsFocused, useNavigation } from "@react-navigation/native";
import type { Dispatch, SetStateAction } from "react";
import {
  createContext,
  use,
  useCallback,
  useLayoutEffect,
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

export type FormProviderArguments<TSchema extends v.ObjectSchema<any, any>> = {
  schema: TSchema;
  initData: v.InferOutput<TSchema>;
  /** Fields omitted during normal validation. Will be checked in `onSubmit`. */
  omittedFields?: Array<keyof v.InferOutput<TSchema>>;
  onSubmit: (
    data: v.InferOutput<TSchema>,
    changes: Partial<v.InferOutput<TSchema>>,
  ) => void | Promise<void>;

  /** Additional validation to check whether we can submit. */
  onConstraints?: (data: v.InferOutput<TSchema>) => boolean;

  /** Change method of leaving form. */
  handleGoBack?: VoidFunction;
  /** Determine if the "Unsaved Changes" prompt can be disabled. Defaults `true`. */
  promptUnsavedChanges?: boolean;
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

const UnsavedChangesContext = createContext<{
  enabled: boolean;
  showConfirmation: boolean;
  setShowConfirmation: Dispatch<SetStateAction<boolean>>;
}>(null as never);

const GoBackContext = createContext<VoidFunction>(null as never);

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
  props: FormProviderArguments<TSchema> & { children: React.ReactNode },
) {
  const navigation = useNavigation();
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
  const handleGoBackRef = useRef(props.handleGoBack);

  const [data, setData] = useState(props.initData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  //? Use stable callbacks (via refs) to minimize re-renders. The only props
  //? that can be changed are: `initData`, `onSubmit`, and `handleGoBack`.
  //?   - `initData` changing means we should reset the form.
  useLayoutEffect(() => {
    onSubmitRef.current = props.onSubmit;
    handleGoBackRef.current = props.handleGoBack;

    //? The following check should be fine since the order of the properties in
    //? `initData` shouldn't change.
    if (JSON.stringify(initData.current) === JSON.stringify(props.initData))
      return;
    initData.current = props.initData;
    setData(props.initData);
  }, [props.handleGoBack, props.initData, props.onSubmit]);

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

  const onConstraints = props.onConstraints;
  const passedConstraints = useMemo(() => {
    if (!onConstraints) return true;
    return onConstraints(data);
  }, [data, onConstraints]);

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
      await onSubmitRef.current(
        parsedData.output,
        Object.keys(parsedData.output).reduce(
          (prev, key: keyof v.InferOutput<TSchema>) => {
            if (initData.current[key] !== parsedData.output[key])
              prev[key] = parsedData.output[key];
            return prev;
          },
          {} as Partial<v.InferOutput<TSchema>>,
        ),
      );
    } catch {}
    setIsSubmitting(false);
  }, [canSubmit, data]);

  const handleGoBack = useCallback(() => {
    if (handleGoBackRef.current) handleGoBackRef.current();
    else navigation.goBack();
    // Reset form data when we dismiss. Necessary if we have the form in a sheet.
    setData(initData.current);
  }, [navigation]);

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
      <UnsavedChangesContext
        value={{
          enabled: props.promptUnsavedChanges ?? true,
          showConfirmation,
          setShowConfirmation,
        }}
      >
        <GoBackContext value={handleGoBack}>
          {props.children}
          <UnsavedChangesPrompt />
        </GoBackContext>
      </UnsavedChangesContext>
    </FormStateContext>
  );
}
//#endregion

//#region Actions
/** Returns partial props for an `IconButton` for the "back" action. */
export function useBackAction() {
  const { t } = useTranslation();
  const { hasChanged, isSubmitting } = useFormContext();
  const { enabled: promptEnabled, setShowConfirmation } = use(
    UnsavedChangesContext,
  );
  const goBack = use(GoBackContext);
  return useMemo(
    () =>
      ({
        icon: "close",
        accessibilityLabel: t("form.back"),
        onPress: () => {
          if (hasChanged && promptEnabled) return setShowConfirmation(true);
          goBack();
        },
        disabled: isSubmitting,
      }) satisfies IconButtonProps,
    [t, hasChanged, isSubmitting, promptEnabled, setShowConfirmation, goBack],
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
  const isFocused = useIsFocused();
  const { text } = useTheme().colors;
  const { hasChanged, isSubmitting } = useFormContext();
  const {
    enabled: promptEnabled,
    showConfirmation,
    setShowConfirmation,
  } = use(UnsavedChangesContext);
  const goBack = use(GoBackContext);

  useBackHandler(
    () => {
      if (!hasChanged || !promptEnabled) goBack();
      else if (!isSubmitting) setShowConfirmation(true);
      return true;
    },
    [hasChanged, isSubmitting, promptEnabled, goBack],
    isFocused,
  );

  return (
    <Dialog
      visible={promptEnabled && showConfirmation}
      onClose={() => setShowConfirmation(false)}
    >
      <TText textKey="form.unsaved" style={{ fontSize: 18 }} />
      <View className="flex-row items-center gap-2">
        <Ripple
          onPress={() => {
            goBack();
            setShowConfirmation(false);
          }}
          className="flex-1 rounded-full p-3"
        >
          <TText textKey="form.leave" center />
        </Ripple>
        <Ripple
          onPress={() => setShowConfirmation(false)}
          color="text"
          style={{ backgroundColor: text }}
          className="flex-1 rounded-full p-3"
        >
          <TText textKey="form.stay" center color="background" />
        </Ripple>
      </View>
    </Dialog>
  );
}
//#endregion
