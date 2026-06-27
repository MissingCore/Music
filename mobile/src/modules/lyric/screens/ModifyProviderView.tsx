// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";

import { PagePlaceholder } from "~/navigation/components/Placeholder";

import { ModifyLyricProvierBase } from "../components/ModifyProviderViewBase";
import { useLyricStore } from "../core/store";
import { deleteLyricProvider, updateLyricProvider } from "../core/actions";

type Props = StaticScreenProps<{ id: string }>;

export default function ModifyLyricProvider({
  route: {
    params: { id: providerId },
  },
}: Props) {
  const navigation = useNavigation();
  const lyricProviders = useLyricStore((s) => s.providers);

  const _currentProvider = lyricProviders.find(
    (provider) => provider.id === providerId,
  );

  if (!_currentProvider) return <PagePlaceholder isPending={false} />;

  const { id: _, ...currentProvider } = _currentProvider;

  return (
    <ModifyLyricProvierBase
      initialData={currentProvider}
      actionConfig={{
        label: "form.delete",
        action: () => {
          deleteLyricProvider(providerId);
          navigation.goBack();
        },
        danger: true,
      }}
      onSubmit={(entry) => {
        updateLyricProvider(providerId, entry);
        navigation.goBack();
      }}
    />
  );
}
