// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { cn } from "~/lib/style";
import type { ScrollViewProps } from "~/components/Base/ScrollView";
import { ScrollView } from "~/components/Base/ScrollView";
import { Text } from "~/components/next/base/typography";
import { ToolbarScreenOffset } from "~/components/next/composed/toolbar";
import type { TranslationKeyOrString } from "~/modules/i18n/core";
import { useMaybeT } from "~/modules/i18n/core";

/** Layout rendering a screen with a title, list of contents, and toolbar. */
export function ScrollLayout({
  title,
  children,
  ...props
}: ScrollViewProps & { title: TranslationKeyOrString }) {
  return (
    <ScrollView
      {...props}
      contentContainerClassName={cn(
        "grow gap-6 p-4",
        ToolbarScreenOffset,
        props.contentContainerClassName,
      )}
    >
      <ScrollLayoutTitle title={title} />
      {children as React.ReactNode}
    </ScrollView>
  );
}

export function ScrollLayoutTitle(props: {
  title: TranslationKeyOrString;
  className?: string;
}) {
  const t = useMaybeT();
  return (
    <Text accent className={props.className}>
      {t(props.title)}
    </Text>
  );
}
