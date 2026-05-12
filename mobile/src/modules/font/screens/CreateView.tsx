import { toast } from "@missingcore/toast";
import { getDocumentAsync } from "expo-document-picker";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { z } from "zod/mini";

import { Close } from "~/resources/icons/Close";

import { router } from "~/navigation/utils/router";

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
import { saveFont } from "../helpers/storage";
import { createCustomFont, revalidateCustomFonts } from "../queries";
import { loadCustomFonts } from "../utils";

function useFormState() {
  return useFormStateContext<FontEntry>();
}

export default function CreateFont() {
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
      const { assets, canceled } = await getDocumentAsync({
        type: ["font/otf", "font/ttf"],
      });
      if (canceled) throw new Error(t("err.msg.actionCancel"));
      if (!assets[0]) throw new Error(t("err.msg.noSelect"));

      await wait(100);
      toast.t("feat.backup.extra.importSuccess");
      setFields({ uri: assets[0].uri });
    } catch (err) {
      toast.error((err as Error).message);
    }
  }, [t, setFields]);

  return (
    <KeyboardAwareScrollView contentContainerClassName="gap-6 p-4">
      <FormInput labelKey="feat.trackMetadata.extra.name" field="name" />
      {!data.uri ? (
        <ExtendedTButton
          textKey="feat.backup.extra.import"
          onPress={onImportFont}
          disabled={isSubmitting}
          className="bg-secondary active:bg-secondaryDim"
          textClassName="text-onSecondary"
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
            Icon={Close}
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

//#region Submit Handler
async function onCreateFont({ name, uri }: FontEntry) {
  try {
    const savedUri = await saveFont(uri);

    await createCustomFont({ name, uri: savedUri });
    await loadCustomFonts([{ uri: savedUri }]);
    revalidateCustomFonts();

    router.back();
  } catch {
    toast.tError("err.flow.generic.title");
  }
}
//#endregion
