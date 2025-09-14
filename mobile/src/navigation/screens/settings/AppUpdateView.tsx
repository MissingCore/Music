import { openBrowserAsync } from "expo-web-browser";
import { Text, View } from "react-native";
import Markdown from "react-native-markdown-display";

import { LogoGitHub } from "~/resources/icons/LogoGitHub";
import { LogoPlayStore } from "~/resources/icons/LogoPlayStore";
import { useUserPreferencesStore } from "~/services/UserPreferences";
import { useHasNewUpdate } from "~/hooks/useHasNewUpdate";
import { useTheme } from "~/hooks/useTheme";
import { StandardScrollLayout } from "~/layouts/StandardScroll";

import * as LINKS from "~/constants/Links";
import { FontSize } from "~/constants/Styles";
import { getFont } from "~/lib/style";
import { Button } from "~/components/Form/Button";
import { AccentText } from "~/components/Typography/AccentText";
import { TStyledText } from "~/components/Typography/StyledText";

export default function AppUpdate() {
  const { release, isRC } = useHasNewUpdate();
  const { theme, foreground } = useTheme();
  const accentFont = useUserPreferencesStore((state) => state.accentFont);
  const primaryFont = useUserPreferencesStore((state) => state.primaryFont);

  if (!release) return null;

  // Light: 5% Opacity; Dark: 15% Opacity
  const codeBg = `${foreground}${theme === "dark" ? "26" : "0D"}`;

  return (
    <StandardScrollLayout>
      <AccentText className="text-4xl" originalText>
        {release.version}
      </AccentText>

      <Markdown
        style={{
          body: {
            gap: 12,
            fontFamily: getFont(primaryFont),
            fontSize: 12,
            color: `${foreground}99`,
          },
          heading2: {
            color: foreground,
            fontFamily: getFont(accentFont),
            fontSize: FontSize.base,
          },
          blockquote: {
            marginLeft: 0,
            padding: 16,
            paddingHorizontal: 16,
            backgroundColor: codeBg,
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
              style={{ backgroundColor: codeBg }}
              className="translate-y-0.5 rounded-sm px-1"
            >
              <Text
                style={{ fontFamily: "monospace" }}
                className="text-left text-xxs text-foreground/60"
              >
                {node.content}
              </Text>
            </View>
          ),
          link: (node, children, _parent, styles) => (
            <Text
              key={node.key}
              style={styles.link}
              onPress={() => openBrowserAsync(node.attributes.href)}
            >
              {children}
            </Text>
          ),
        }}
      >
        {release.releaseNotes}
      </Markdown>

      <View className="gap-2">
        <Button
          onPress={() =>
            openBrowserAsync(`${LINKS.GITHUB}/releases/tag/${release.version}`)
          }
          className="flex-row justify-start gap-4"
        >
          <LogoGitHub />
          <TStyledText
            textKey="feat.appUpdate.extra.downloadAPK"
            className="text-center text-sm"
          />
        </Button>
        {!isRC ? (
          <Button
            onPress={() => openBrowserAsync(LINKS.PLAYSTORE)}
            className="flex-row justify-start gap-4"
          >
            <LogoPlayStore />
            <TStyledText
              textKey="feat.appUpdate.extra.updateGoogle"
              className="text-center text-sm"
            />
          </Button>
        ) : null}
      </View>
    </StandardScrollLayout>
  );
}
