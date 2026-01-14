import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Close } from "~/resources/icons/Close";
import { Search } from "~/resources/icons/Search";

import { IconButton } from "~/components/Form/Button/Icon";
import { TextInput, useInputRef } from "~/components/Form/Input";

export function SearchBar(props: {
  searchPlaceholder: string;
  query: string;
  setQuery: (query: string) => void;
  autoFocus?: boolean;
}) {
  const { t } = useTranslation();
  const inputRef = useInputRef();

  return (
    <View className="flex-row items-center gap-2 rounded-full bg-surfaceContainerLowest pl-4">
      <Search />
      <TextInput
        ref={inputRef}
        autoFocus={props.autoFocus}
        onChangeText={props.setQuery}
        placeholder={props.searchPlaceholder}
        className="shrink grow"
        forSheet
      />
      <IconButton
        Icon={Close}
        accessibilityLabel={t("form.clear")}
        onPress={() => {
          inputRef.current?.clear();
          props.setQuery("");
        }}
        disabled={props.query === ""}
        className="mr-1 disabled:invisible"
      />
    </View>
  );
}
