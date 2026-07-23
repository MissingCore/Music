// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";
import { useNavigation } from "@react-navigation/native";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { z } from "zod/mini";

import { pickFile } from "~/lib/file-system";
import { wait } from "~/utils/promise";
import { KeyboardAwareScrollView } from "~/components/Base/ScrollView";
import { ExtendedTButton } from "~/components/Form/Button";
import { IconButton } from "~/components/Form/Button/Icon";
import { StyledText } from "~/components/Typography/StyledText";
import {
  FormStateProvider,
  useFormStateContext,
} from "~/modules/form/FormState";
import { FormInputImpl } from "~/modules/form/FormState/FormInput";
import { ZSchema } from "~/modules/form/utils";
import { saveCustomFont } from "../core/data";
import { loadCustomFont } from "../utils";

function useFormState() {
  return useFormStateContext<FontEntry>();
}

export default function CreateFont() {
  const navigation = useNavigation();

  const onCreateFont = useCallback(
    async (entry: FontEntry) => {
      const result = await saveCustomFont(entry);
      if (result) {
        await loadCustomFont(result.uri);
        navigation.goBack();
      }
    },
    [navigation],
  );

  return (
    <FormStateProvider
      schema={FontEntrySchema}
      initData={{ name: "", uri: "" }}
      onSubmit={onCreateFont}
    >
      <FontForm />
    </FormStateProvider>
  );
}

//#region Font Form
const FormInput = FormInputImpl<FontEntry>();

function FontForm() {
  const { t } = useTranslation();
  const { data, setFields, isSubmitting } = useFormState();

  const onImportFont = useCallback(async () => {
    try {
      const fontFile = await pickFile(["font/otf", "font/ttf"]);
      await wait(100);
      toast.t("feat.backup.extra.importSuccess");
      setFields({ uri: fontFile.uri });
    } catch (err) {
      toast.error((err as Error).message);
    }
  }, [setFields]);

  return (
    <KeyboardAwareScrollView contentContainerClassName="gap-6 p-4">
      <FormInput labelKey="feat.trackMetadata.extra.name" field="name" />
      {!data.uri ? (
        <ExtendedTButton
          textKey="feat.backup.extra.import"
          onPress={onImportFont}
          theme="secondary"
        />
      ) : (
        <View className="flex-row items-center gap-4">
          <StyledText
            numberOfLines={1}
            ellipsizeMode="head"
            className="shrink grow"
          >
            {data.uri}
          </StyledText>
          <IconButton
            icon="close"
            accessibilityLabel={t("template.entryRemove", { name: data.uri })}
            onPress={() => setFields({ uri: "" })}
            disabled={isSubmitting}
          />
        </View>
      )}
    </KeyboardAwareScrollView>
  );
}
//#endregion

//#region Schema
const FontEntrySchema = z.object({
  name: ZSchema.NonEmptyString,
  uri: ZSchema.NonEmptyString,
});

type FontEntry = z.infer<typeof FontEntrySchema>;
//#endregion
