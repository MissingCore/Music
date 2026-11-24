// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useTheme } from "~/_next/context/theme-context";
import { useFormContext } from ".";

import { getImageUri, pickImage } from "~/lib/file-system";
import type { KeysOfValue } from "~/utils/types";
import { cn } from "~/_next/utils/style";
import { Image } from "~/_next/components/primitives/image";
import { IconButton } from "~/_next/components/button-icon";
import { Icon } from "~/_next/components/icon";
import { TextInput } from "~/_next/components/input";
import { Ripple } from "~/_next/components/ripple";
import { Text } from "~/_next/components/typography";

//#region Label
export function InputLabel(props: { label: string; className?: string }) {
  return (
    <View
      className={cn(
        "mb-2 flex-row items-center justify-between gap-4",
        props.className,
      )}
    >
      <Text bold size="sm">
        {props.label}
      </Text>
    </View>
  );
}
//#endregion

export function createTypedFormInputs<TData extends Record<string, any>>() {
  interface FormInputProps<TResult> {
    label: string;
    //? The `& string` is to strip the `number | symbol` from the type.
    field: KeysOfValue<TData, TResult> & string;
  }

  /** Helper to simplify getting the outputs. */
  function useFormProperties<TResult>(field: string) {
    const { data, setField, isSubmitting } = useFormContext<TData>();
    return {
      value: data[field] as TResult,
      setField: (cb: (prevValue: TResult) => TResult) =>
        setField((prev) => ({ ...prev, [field]: cb(prev[field]) })),
      isSubmitting,
    };
  }

  const baseInputStyles = "h-12 w-full rounded-lg border p-2";

  //#region Text
  function TextFormInput({ label, field }: FormInputProps<string>) {
    const { border: borderColor } = useTheme().colors;
    const { value, setField, isSubmitting } = useFormProperties<string>(field);
    return (
      <View className="shrink grow">
        <InputLabel label={label} />
        <TextInput
          editable={!isSubmitting}
          value={value}
          onChangeText={(text) => setField(() => text)}
          className={baseInputStyles}
          style={{ borderColor, textAlignVertical: "center" }}
        />
      </View>
    );
  }
  //#endregion

  //#region Image
  function ImageInput() {
    const { t } = useTranslation();
    const { surface: backgroundColor } = useTheme().colors;
    const [pending, setPending] = useState(false);
    const { data } = useFormContext<TData>();
    const { value, setField, isSubmitting } =
      useFormProperties<string>("artwork");

    const changeImage = useCallback(async () => {
      if (data?.artwork === undefined) {
        console.warn(
          "Image Input not supported due to missing `artwork` field.",
        );
        return;
      }
      setPending(true);
      try {
        const image = await pickImage();
        if (image) setField(() => image);
      } catch {}
      setPending(false);
    }, [data?.artwork, setField]);

    const resetImage = useCallback(() => {
      if (data?.initArtwork === undefined) {
        console.warn(
          "Image Input reset functionality not supported due to missing `initArtwork` field.",
        );
        return;
      }
      setField(() => data.initArtwork);
    }, [data?.initArtwork, setField]);

    const canResetField = data?.initArtwork !== value;

    return (
      <Ripple
        onPress={changeImage}
        disabled={pending || isSubmitting}
        className="relative size-28 rounded-xl"
      >
        <Image
          source={getImageUri(value)}
          style={{ backgroundColor }}
          className="size-full"
        />
        <Icon
          name="pencil"
          color="#FFF"
          size={32}
          className="absolute inset-0 items-center justify-center bg-black/15"
        />
        {canResetField ? (
          <IconButton
            icon="minimize"
            accessibilityLabel={t("form.reset")}
            onPress={resetImage}
            iconColor="#FFF"
            size="sm"
            className="absolute top-1 right-1 bg-black/25"
          />
        ) : null}
      </Ripple>
    );
  }
  //#endregion

  return { Text: TextFormInput, Image: ImageInput };
}
