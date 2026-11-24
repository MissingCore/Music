// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useState } from "react";
import { View } from "react-native";
import type * as v from "valibot";

import type { FormProviderArguments } from ".";
import { FormProvider, useBackAction, useSubmitAction } from ".";

import { IconButton } from "~/_next/components/button-icon";
import { Marquee } from "~/_next/components/marquee";
import type { SheetRef } from "~/_next/components/sheet";
import { ScrollableSheet, SheetHeader } from "~/_next/components/sheet";
import { Text } from "~/_next/components/typography";

export function FormSheet<TSchema extends v.ObjectSchema<any, any>>({
  ref,
  label,
  children,
  ...props
}: {
  ref: SheetRef;
  label: string;
  children: React.ReactNode;
} & Omit<FormProviderArguments<TSchema>, "handleGoBack">) {
  const [presented, setPresented] = useState(false);
  return (
    <FormProvider
      {...props}
      handleGoBack={presented ? () => ref.current?.dismiss() : undefined}
    >
      <ScrollableSheet
        ref={ref}
        dismissible={false}
        setVisibility={setPresented}
        header={<FormSheetHeader label={label} />}
      >
        {children}
      </ScrollableSheet>
    </FormProvider>
  );
}

function FormSheetHeader({ label }: { label: string }) {
  const backAction = useBackAction();
  const submitAction = useSubmitAction();
  return (
    <SheetHeader showHandle={false}>
      <View className="flex-row items-center justify-between px-2">
        <IconButton {...backAction} />
        <Marquee center>
          <Text bold>{label}</Text>
        </Marquee>
        <IconButton {...submitAction} className="disabled:opacity-25" />
      </View>
    </SheetHeader>
  );
}
