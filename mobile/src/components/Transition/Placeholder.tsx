import type { ParseKeys } from "i18next";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Loading } from "./Loading";
import { StyledText } from "../Typography";

/** Placeholder to render inside a list. */
export function ContentPlaceholder(props: {
  isPending?: boolean;
  /** Key to error messaeg in translations. */
  errMsgKey?: ParseKeys;
}) {
  const { t } = useTranslation();
  return props.isPending ? (
    <Loading />
  ) : (
    <StyledText center>{t(props.errMsgKey ?? "response.noContent")}</StyledText>
  );
}

/** Placeholder to render while waiting for data from React Query. */
export function PagePlaceholder(props: {
  isPending: boolean;
  /** Key to error messaeg in translations. */
  errMsgKey?: ParseKeys;
}) {
  return (
    <View className="w-full flex-1 p-4">
      <ContentPlaceholder {...props} />
    </View>
  );
}
