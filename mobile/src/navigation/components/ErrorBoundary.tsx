import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import Bootsplash from "react-native-bootsplash";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CAN_SENTRY_REPORT } from "~/env";
import { playbackStore } from "~/stores/Playback/store";
import { useFloatingContent } from "../hooks/useFloatingContent";
import { ListLayout } from "../layouts/ListLayout";
import { AppProvider } from "../providers/AppProvider";

import { Sentry } from "~/lib/sentry";
import { Links, openLink } from "~/lib/web-browser";
import { Button } from "~/components/Form/Button";
import { AccentText } from "~/components/Typography/AccentText";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";

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

/** Screen displayed when an error is thrown in a component. */
function ErrorLayout({ error }: { error: Error }) {
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  const { offset, floatingContentProps } = useFloatingContent();

  const onError = useCallback(() => {
    // Display error message to user if encountered.
    Bootsplash.hide();
    playbackStore.getState().resetOnCrash();

    // Send error message to Sentry.
    if (CAN_SENTRY_REPORT) Sentry.captureException(error);

    return () => {};
  }, [error]);

  return (
    <>
      <View ref={onError} />
      <View className="relative flex-1">
        <ListLayout contentContainerStyle={{ paddingBottom: offset }}>
          <AccentText style={{ paddingTop: top + 16 }}>
            {t("err.flow.generic.title")}
          </AccentText>
          <TStyledText
            dim
            textKey="err.flow.generic.brief"
            className="text-base"
          />
          <View className="rounded-md bg-surfaceContainerLowest p-4">
            <StyledText>{error.message}</StyledText>
          </View>
          {hasMissingMigrations(error.message) ? (
            <View className="rounded-md bg-secondary p-4">
              <StyledText bold className="text-onSecondary">
                {
                  "❗Detected error caused by migrations never applied from versions between then and now, which have since been removed.❗\n\nThis error can only be resolved by clearing this app's storage, which results in data loss, requiring you to re-create your playlists & favorites."
                }
              </StyledText>
            </View>
          ) : null}
          <StyledText dim className="text-sm">
            {error.stack}
          </StyledText>
        </ListLayout>
        <View {...floatingContentProps}>
          <Button
            onPress={() => openLink(Links.Issues)}
            className="w-full bg-error active:bg-errorDim"
          >
            <TStyledText
              textKey="err.flow.report.title"
              className="text-center text-onError"
            />
            <TStyledText
              textKey="err.flow.report.brief"
              className="text-center text-xs text-onErrorVariant"
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
