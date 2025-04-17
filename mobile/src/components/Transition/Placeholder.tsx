import type { ParseKeys } from "i18next";
import { View } from "react-native";

import { Loading } from "./Loading";
import { TStyledText } from "../Typography/StyledText";

/** Placeholder to render inside a list. */
export function ContentPlaceholder(props: {
  isPending?: boolean;
  /** Key to error messaeg in translations. */
  errMsgKey?: ParseKeys;
}) {
  return (
    <View className="p-4">
      {props.isPending ? (
        <Loading />
      ) : (
        <TStyledText textKey={props.errMsgKey ?? "err.msg.noContent"} center />
      )}
    </View>
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
