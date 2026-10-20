// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import type { ParseKeys } from "i18next";
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
import type { KeyboardAwareScrollViewProps } from "react-native-keyboard-controller";
import * as v from "valibot";

import { useBackHandler } from "~/hooks/useBackHandler";

import { OnRTL } from "~/lib/react";
import { cn } from "~/lib/style";
import { wait } from "~/utils/promise";
import { isBoolean, isNumber, isString } from "~/utils/validation";
import { KeyboardAwareScrollView } from "~/components/Base/ScrollView";
import type { IconButtonProps } from "~/components/next/base/button-icon";
import { IconButton } from "~/components/next/base/button-icon";
import { Dialog } from "~/components/next/base/dialog";
import { Text, TText } from "~/components/next/base/typography";
import { ActionButton } from "~/components/next/blocks/button-action";
import { ConfirmAction } from "~/components/next/composed/confirm-action";
import {
  Toolbar,
  ToolbarScreenOffset,
} from "~/components/next/composed/toolbar";

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
    throw new Error("`useFormContext` must be used in a `Form.Provider`.");
  return context as FormState<TData>;
}
//#endregion

//#region Provider
function FormStateProvider<TSchema extends v.ObjectSchema<any, any>>(
  props: InitialArguments<TSchema> & { children: React.ReactNode },
) {
  const initData = useRef(props.initData);
  const schemaRef = useRef(props.schema);
  const partialSchemaRef = useRef(
    props.omittedFields
      ? v.omit(
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
        <UnsavedChangesPrompt />
      </UnsavedChangesContext>
    </FormStateContext>
  );
}
//#endregion

//#region Form Action
export type FormActionConfig<TData extends Record<string, any>> = {
  label: ParseKeys;
  onPress: (
    context: Pick<FormState<TData>, "setFields">,
  ) => void | Promise<void>;
  config: Omit<IconButtonProps, "accessibilityLabel" | "onPress" | "disabled">;
  /** If the action requires confirmation. */
  requiresConfirmation?: boolean;
};

/** Returns an action that can be displayed in the form or toolbar. */
export function useFormAction<TData extends Record<string, any>>(
  args?: FormActionConfig<TData>,
) {
  const { t } = useTranslation();
  const { setFields, isSubmitting, setIsSubmitting } = useFormContext();

  if (!args) return null;

  const renderedAction = (
    <IconButton
      {...args.config}
      accessibilityLabel={t(args.label)}
      onPress={async () => {
        setIsSubmitting(true);
        try {
          await args.onPress({ setFields });
        } catch {}
        setIsSubmitting(false);
      }}
      disabled={isSubmitting}
    />
  );

  if (!args.requiresConfirmation) return renderedAction;
  return (
    <ConfirmAction prompt={[t(args.label)]}>{renderedAction}</ConfirmAction>
  );
}
//#endregion

//#region Exports
export const Form = {
  /** Handles data validation, back prevention, and more. */
  Provider: FormStateProvider,
  /**
   * Keyboard-aware layout that lets inputs at the bottom of the screen
   * be in-view when focused.
   */
  Container: ({
    contentContainerClassName,
    ...props
  }: KeyboardAwareScrollViewProps) => {
    return (
      <KeyboardAwareScrollView
        {...props}
        contentContainerClassName={cn(
          "gap-6 p-4",
          ToolbarScreenOffset,
          contentContainerClassName,
        )}
      />
    );
  },
  /** Pre-defined title component to place in form layout. */
  Title: () => {
    const { t } = useTranslation();
    const { type } = useFormContext();
    return (
      <Text accent className="leading-tight">
        {t(`form.${type}`)}
      </Text>
    );
  },
  /** Toolbar layout for forms. */
  Toolbar: (props: { children?: React.ReactNode }) => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { hasChanged, canSubmit, onSubmit, isSubmitting } = useFormContext();
    const { setShowConfirmation } = use(UnsavedChangesContext);
    return (
      <Toolbar>
        <Toolbar.Actions>
          <IconButton
            icon={OnRTL.decide("east", "west")}
            accessibilityLabel={t("form.back")}
            onPress={() => {
              if (hasChanged) return setShowConfirmation(true);
              navigation.goBack();
            }}
            disabled={isSubmitting}
          />
          {props.children}
        </Toolbar.Actions>
        <Toolbar.FAB
          icon="save"
          accessibilityLabel={t("form.apply")}
          onPress={onSubmit}
          disabled={!canSubmit || isSubmitting}
          intent="inverse"
        />
      </Toolbar>
    );
  },
};
//#endregion

//#region Internal
function UnsavedChangesPrompt() {
  const { t } = useTranslation();
  const navigation = useNavigation();
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
      <Dialog.Actions>
        <ActionButton
          label={t("form.leave")}
          onPress={() => {
            navigation.goBack();
            setShowConfirmation(false);
          }}
          labelClassName="text-error"
          className="rounded-lg"
        />
        <ActionButton
          label={t("form.stay")}
          onPress={() => setShowConfirmation(false)}
          className="rounded-lg"
        />
      </Dialog.Actions>
    </Dialog>
  );
}
//#endregion
