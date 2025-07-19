import type { ParseKeys } from "i18next";
import { View } from "react-native";

import { cn } from "~/lib/style";
import { Loading } from "./Loading";
import { StyledText, TStyledText } from "../Typography/StyledText";

type ErrorMsgProps = {
  /** Key to error messaeg in translations. */
  errMsgKey?: ParseKeys;
  /** Displays this over the string specified by `errMsgKey`. */
  errMsg?: string;
};

/** Placeholder to render inside a list. */
export function ContentPlaceholder(
  props: ErrorMsgProps & {
    isPending?: boolean;
    className?: string;
  },
) {
  return (
    <View className={cn("p-4", props.className)}>
      {props.isPending ? (
        <Loading />
      ) : props.errMsg ? (
        <StyledText center>{props.errMsg}</StyledText>
      ) : (
        <TStyledText textKey={props.errMsgKey ?? "err.msg.noContent"} center />
      )}
    </View>
  );
}

/** Placeholder to render while waiting for data from React Query. */
export function PagePlaceholder(props: ErrorMsgProps & { isPending: boolean }) {
  return (
    <View className="w-full flex-1 p-4">
      <ContentPlaceholder {...props} />
    </View>
  );
}
