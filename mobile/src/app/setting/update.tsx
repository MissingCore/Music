import * as WebBrowser from "expo-web-browser";
import { Text, View } from "react-native";
import Markdown from "react-native-markdown-display";

import { LogoGitHub } from "~/icons/LogoGitHub";
import { LogoPlayStore } from "~/icons/LogoPlayStore";
import { useUserPreferencesStore } from "~/services/UserPreferences";
import { useHasNewUpdate } from "~/hooks/useHasNewUpdate";
import { useTheme } from "~/hooks/useTheme";
import { StandardScrollLayout } from "~/layouts/StandardScroll";
import { StickyActionHeader } from "~/layouts/StickyActionScroll";

import * as LINKS from "~/constants/Links";
import { FontFamily, FontSize } from "~/constants/Styles";
import { getAccentFont } from "~/lib/style";
import { Button } from "~/components/Form/Button";
import { TStyledText } from "~/components/Typography/StyledText";

/** Screen for `/setting/update` route. */
export default function AppUpdateScreen() {
  const { release, isRC } = useHasNewUpdate();
  const { theme, foreground } = useTheme();
  const accentFont = useUserPreferencesStore((state) => state.accentFont);

  if (!release) return null;

  return (
    <StandardScrollLayout>
      <StickyActionHeader noOffset originalText>
        {release.version}
      </StickyActionHeader>

      <Markdown
        style={{
          body: {
            gap: 12,
            fontFamily: FontFamily.roboto,
            fontSize: 12,
            color: `${foreground}99`,
          },
          heading2: {
            color: foreground,
            fontFamily: getAccentFont(accentFont),
            fontSize: FontSize.base,
          },
          blockquote: {
            marginLeft: 0,
            padding: 16,
            paddingHorizontal: 16,
            // Light: 5% Opacity; Dark: 15% Opacity
            backgroundColor: `${foreground}${theme === "dark" ? "26" : "0D"}`,
            borderRadius: 12,
            borderLeftWidth: 0,
          },
          fence: {
            padding: 16,
            backgroundColor: `${foreground}0D`, // 5% Opacity
            borderRadius: 12,
            borderLeftWidth: 0,
          },
          hr: {
            backgroundColor: `${foreground}1A`, // 10% Opacity
          },
          paragraph: {
            marginTop: 0,
            marginBottom: 0,
          },
        }}
        rules={{
          // Override the 'code' rule to render code blocks as plain text.
          code_inline: (node, _children, _parent, _styles) => (
            <View
              key={node.key}
              className="translate-y-0.5 rounded-sm bg-foreground/5 px-1 dark:bg-foreground/15"
            >
              <Text
                style={{ fontFamily: "monospace" }}
                className="text-xxs text-foreground/60"
              >
                {node.content}
              </Text>
            </View>
          ),
          link: (node, children, _parent, styles) => (
            <Text key={node.key} style={styles.link}>
              {children}
            </Text>
          ),
        }}
      >
        {release.releaseNotes}
      </Markdown>

      <View className="flex-row gap-2">
        <Button
          onPress={() =>
            WebBrowser.openBrowserAsync(
              `${LINKS.GITHUB}/releases/tag/${release.version}`,
            )
          }
          className="flex-1 p-2"
        >
          <LogoGitHub />
          <TStyledText
            textKey="feat.appUpdate.extra.downloadAPK"
            className="text-center text-xs"
          />
        </Button>
        {!isRC ? (
          <Button
            onPress={() => WebBrowser.openBrowserAsync(LINKS.PLAYSTORE)}
            className="flex-1 p-2"
          >
            <LogoPlayStore />
            <TStyledText
              textKey="feat.appUpdate.extra.updateGoogle"
              className="text-center text-xs"
            />
          </Button>
        ) : null}
      </View>
    </StandardScrollLayout>
  );
}
