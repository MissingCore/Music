// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";
import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export function GoBack({ message }: { message?: string }) {
  const { t } = useTranslation();
  const navigation = useNavigation();

  useEffect(() => {
    if (message) toast.error(message);
    navigation.goBack();
  }, [t, navigation, message]);

  return null;
}
