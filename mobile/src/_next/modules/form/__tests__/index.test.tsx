// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { act, renderHook } from "@testing-library/react-native";
import type { PropsWithChildren } from "react";
import * as v from "valibot";

import {
  FormProvider,
  useBackAction,
  useFormContext,
  useSubmitAction,
} from "..";

const mockGoBack = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useIsFocused: () => true,
  useNavigation: () => ({ goBack: mockGoBack }),
}));

jest.mock("@missingcore/native-utils", () => ({
  isSystemDarkMode: true,
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const schema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1)),
  count: v.number(),
});

type FormData = v.InferOutput<typeof schema>;

const initData: FormData = { name: "Initial", count: 1 };

function createWrapper(
  options: Partial<{
    initData: FormData;
    onSubmit: (
      data: FormData,
      changes: Partial<FormData>,
    ) => void | Promise<void>;
    onConstraints: (data: FormData) => boolean;
    omittedFields: Array<keyof FormData>;
    handleGoBack: VoidFunction;
  }> = {},
) {
  const props = {
    schema,
    initData,
    onSubmit: jest.fn(),
    promptUnsavedChanges: false,
    ...options,
  };

  return function FormProviderWrapper({ children }: PropsWithChildren) {
    return <FormProvider {...props}>{children}</FormProvider>;
  };
}

beforeEach(() => {
  mockGoBack.mockClear();
});

describe("FormProvider", () => {
  test("starts unchanged and merges partial and functional field updates", async () => {
    const { result } = await renderHook(() => useFormContext<FormData>(), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toEqual(initData);
    expect(result.current.hasChanged).toBe(false);
    expect(result.current.passedConstraints).toBe(true);
    expect(result.current.canSubmit).toBe(false);

    //? Test both methods of using `setFields`.
    await act(async () => {
      result.current.setFields({ name: "Updated" });
    });
    await act(async () => {
      result.current.setFields((prev) => ({ count: prev.count + 1 }));
    });

    expect(result.current.data).toEqual({ name: "Updated", count: 2 });
    expect(result.current.hasChanged).toBe(true);
    expect(result.current.canSubmit).toBe(true);
  });

  test("blocks submission when data is invalid or constraints fail", async () => {
    const onSubmit = jest.fn();
    const { result } = await renderHook(() => useFormContext<FormData>(), {
      wrapper: createWrapper({
        onSubmit,
        onConstraints: (data) => data.count > 0,
      }),
    });

    await act(async () => {
      result.current.setFields({ name: "" });
    });
    expect(result.current.hasChanged).toBe(true);
    expect(result.current.canSubmit).toBe(false);

    await act(async () => {
      result.current.setFields({ name: "Valid", count: -1 });
    });
    expect(result.current.passedConstraints).toBe(false);
    expect(result.current.canSubmit).toBe(false);

    await act(async () => {
      await result.current.onSubmit();
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("submits parsed data and only the changed fields", async () => {
    const onSubmit = jest.fn();
    const { result } = await renderHook(() => useFormContext<FormData>(), {
      wrapper: createWrapper({ onSubmit }),
    });

    await act(async () => {
      result.current.setFields({ name: "  Updated  " });
    });
    await act(async () => {
      await result.current.onSubmit();
    });

    expect(onSubmit).toHaveBeenCalledWith(
      { name: "Updated", count: 1 },
      { name: "Updated" },
    );
    expect(result.current.isSubmitting).toBe(false);
  });

  test("resets data when the initial data changes", async () => {
    let currentInitData = initData;
    const wrapper = function FormProviderWrapper({
      children,
    }: PropsWithChildren) {
      return (
        <FormProvider
          schema={schema}
          initData={currentInitData}
          onSubmit={jest.fn()}
          promptUnsavedChanges={false}
        >
          {children}
        </FormProvider>
      );
    };

    const { result, rerender } = await renderHook(
      () => useFormContext<FormData>(),
      { wrapper },
    );

    await act(async () => {
      result.current.setFields({ name: "Edited" });
    });

    const nextInitData = { name: "Next", count: 2 };
    currentInitData = nextInitData;
    await rerender(undefined);

    expect(result.current.data).toEqual(nextInitData);
    expect(result.current.hasChanged).toBe(false);
    expect(result.current.canSubmit).toBe(false);
  });

  test("includes omitted fields in the validated submission and change set", async () => {
    const onSubmit = jest.fn();
    const { result } = await renderHook(() => useFormContext<FormData>(), {
      wrapper: createWrapper({ onSubmit, omittedFields: ["name"] }),
    });

    //? We skip checking omitted fields.
    await act(async () => {
      result.current.setFields({ name: "Updated" });
    });
    expect(result.current.canSubmit).toBe(false);

    await act(async () => {
      result.current.setFields({ count: 2 });
    });
    expect(result.current.canSubmit).toBe(true);

    await act(async () => {
      await result.current.onSubmit();
    });

    expect(onSubmit).toHaveBeenCalledWith(
      { name: "Updated", count: 2 },
      { name: "Updated", count: 2 },
    );
  });

  test("does not submit when an omitted field fails full validation", async () => {
    const onSubmit = jest.fn();
    const { result } = await renderHook(() => useFormContext<FormData>(), {
      wrapper: createWrapper({ onSubmit, omittedFields: ["name"] }),
    });

    await act(async () => {
      result.current.setFields({ name: "", count: 2 });
    });
    await act(async () => {
      await result.current.onSubmit();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("clears the submitting state when submission rejects", async () => {
    let rejectSubmission!: (error: Error) => void;
    const pendingSubmission = new Promise<void>((_, reject) => {
      rejectSubmission = reject;
    });
    const onSubmit = jest.fn(() => pendingSubmission);
    const { result } = await renderHook(() => useFormContext<FormData>(), {
      wrapper: createWrapper({ onSubmit }),
    });

    await act(async () => {
      result.current.setFields({ name: "Updated" });
    });

    let submission!: Promise<void>;
    await act(async () => {
      submission = result.current.onSubmit();
      await new Promise((resolve) => setTimeout(resolve, 2));
    });
    expect(result.current.isSubmitting).toBe(true);

    await act(async () => {
      rejectSubmission(new Error("save failed"));
      await submission;
    });

    expect(result.current.isSubmitting).toBe(false);
  });
});

describe("form actions", () => {
  test("disables submit until the form is valid and disables actions while submitting", async () => {
    const { result } = await renderHook(
      () => ({
        form: useFormContext<FormData>(),
        backAction: useBackAction(),
        submitAction: useSubmitAction(),
      }),
      { wrapper: createWrapper() },
    );

    expect(result.current.submitAction).toMatchObject({
      icon: "check",
      accessibilityLabel: "form.apply",
      disabled: true,
    });
    expect(result.current.backAction.disabled).toBe(false);

    await act(async () => {
      result.current.form.setFields({ name: "Updated" });
    });
    expect(result.current.submitAction.disabled).toBe(false);

    await act(async () => {
      result.current.form.setIsSubmitting(true);
    });
    expect(result.current.submitAction.disabled).toBe(true);
    expect(result.current.backAction.disabled).toBe(true);
  });

  test("uses the custom back handler or navigation fallback", async () => {
    const handleGoBack = jest.fn();
    const { result: customResult } = await renderHook(() => useBackAction(), {
      wrapper: createWrapper({ handleGoBack }),
    });
    await act(async () => {
      customResult.current.onPress();
    });
    expect(handleGoBack).toHaveBeenCalledTimes(1);
    expect(mockGoBack).not.toHaveBeenCalled();

    const { result: navigationResult } = await renderHook(
      () => useBackAction(),
      { wrapper: createWrapper() },
    );
    await act(async () => {
      navigationResult.current.onPress();
    });
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });
});
