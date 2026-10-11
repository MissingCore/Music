// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ParseKeys } from "i18next";

import { cn } from "~/lib/style";
import type { ScrollViewProps } from "~/components/Base/ScrollView";
import { ScrollView } from "~/components/Base/ScrollView";
import { TText } from "~/components/next/base/typography";
import { ToolbarScreenOffset } from "~/components/next/composed/toolbar";

/** Layout rendering a screen with a title, list of contents, and toolbar. */
export function ScrollLayout({
  title,
  children,
  ...props
}: ScrollViewProps & { title: ParseKeys }) {
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
  title: ParseKeys;
  className?: string;
}) {
  return <TText textKey={props.title} accent className={props.className} />;
}
