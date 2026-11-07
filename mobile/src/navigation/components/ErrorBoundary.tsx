// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Bootsplash from "react-native-bootsplash";

import { CAN_SENTRY_REPORT } from "~/env";
import { playbackStore } from "~/stores/Playback/store";

import { ScrollLayout } from "../layouts/ScrollLayout";
import { AppProvider } from "../providers/AppProvider";

import { Sentry } from "~/lib/sentry";
import { Links, openLink } from "~/lib/web-browser";
import { Button } from "~/components/next/base/button";
import { Card } from "~/components/next/base/card";
import { Text, TText } from "~/components/next/base/typography";
import { createTextStack } from "~/components/next/blocks/text-stack";

type State = { error: Error | null };

type Props = React.PropsWithChildren<{ error?: Error }>;

export class ErrorBoundary extends React.Component<
  Props,
  { error: Error | null }
> {
  state: State = { error: null };

  constructor(props: Props) {
    super(props);
    this.state = { error: props.error ?? null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    return this.state.error ? (
      <AppProvider>
        <ErrorLayout error={this.state.error} />
      </AppProvider>
    ) : (
      this.props.children
    );
  }
}

const ErrorTextStack = createTextStack({
  labelConfig: { intent: "error", size: "sm", center: true },
  supportingConfig: { intent: "error", muted: true, center: true },
});

/** Screen displayed when an error is thrown in a component. */
function ErrorLayout({ error }: { error: Error }) {
  const { t } = useTranslation();
  const [offset, setOffset] = useState(0);

  const onError = useCallback(() => {
    // Display error message to user if encountered.
    Bootsplash.hide();
    playbackStore.getState().reset();

    // Send error message to Sentry.
    if (CAN_SENTRY_REPORT) Sentry.captureException(error);

    return () => {};
  }, [error]);

  return (
    <>
      <View ref={onError} />
      <View className="relative flex-1">
        <ScrollLayout
          title="err.flow.generic.title"
          contentContainerStyle={{ paddingBottom: offset + 16 }}
        >
          <TText textKey="err.flow.generic.brief" muted size="base" />
          <Card>
            <Text>{error.message}</Text>
          </Card>
          {hasMissingMigrations(error.message) ? (
            <Card intent="secondary">
              <Text intent="secondary" bold>
                {
                  "❗Detected error caused by migrations never applied from versions between then and now, which have since been removed.❗\n\nThis error can only be resolved by clearing this app's storage, which results in data loss, requiring you to re-create your playlists & favorites."
                }
              </Text>
            </Card>
          ) : null}
          <Text muted size="sm">
            {error.stack}
          </Text>
        </ScrollLayout>
        <View
          onLayout={(e) => setOffset(e.nativeEvent.layout.height)}
          className="absolute inset-x-4 bottom-0 pb-safe-offset-4"
        >
          <Button
            onPress={() => openLink(Links.Issues)}
            intent="error"
            className="py-4"
          >
            <ErrorTextStack
              label={t("err.flow.report.title")}
              supporting={t("err.flow.report.brief")}
            />
          </Button>
        </View>
      </View>
    </>
  );
}

/**
 * Determines if the user is upgrading from a very old version of the app
 * where some critical migrations weren't applied.
 */
function hasMissingMigrations(message: string) {
  return (
    message.includes("Failed to run the query") &&
    message.includes("CREATE UNIQUE INDEX")
  );
}
