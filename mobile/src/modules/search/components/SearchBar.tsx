import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Icon } from "~/resources/icons";
import { Close } from "~/resources/icons/Close";

import { IconButton } from "~/components/Form/Button/Icon";
import { TextInput, useInputRef } from "~/components/Form/Input";

export function SearchBar(props: {
  searchPlaceholder: string;
  setQuery: (query: string) => void;
  isEmpty: boolean;
  autoFocus?: boolean;
}) {
  const { t } = useTranslation();
  const inputRef = useInputRef();

  return (
    <View className="flex-row items-center gap-2 rounded-full bg-surfaceContainerLowest pl-4">
      <Icon name="search" />
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
        disabled={props.isEmpty}
        className="mr-1 disabled:invisible"
      />
    </View>
  );
}
