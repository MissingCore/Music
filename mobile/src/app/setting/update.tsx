import * as WebBrowser from "expo-web-browser";
import { Text, View } from "react-native";
import Markdown from "react-native-markdown-display";

import { LogoGitHub, LogoPlayStore } from "@/icons";
import { useUserPreferencesStore } from "@/services/UserPreferences";
import { useHasNewUpdate } from "@/hooks/useHasNewUpdate";
import { useTheme } from "@/hooks/useTheme";
import { StickyActionHeader } from "@/layouts";

import * as LINKS from "@/constants/Links";
import { FontFamily, FontSize } from "@/constants/Styles";
import { ScrollView } from "@/components/Defaults";
import { Button } from "@/components/Form";
import { TStyledText } from "@/components/Typography";

/** Screen for `/setting/update` route. */
export default function AppUpdateScreen() {
  const { release, isRC } = useHasNewUpdate();
  const { foreground } = useTheme();
  const accentFont = useUserPreferencesStore((state) => state.accentFont);

  if (!release) return null;

  return (
    <ScrollView contentContainerClassName="grow gap-6 p-4">
      <StickyActionHeader noOffset>{release.version}</StickyActionHeader>

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
            fontFamily:
              accentFont === "NDot" ? FontFamily.ndot : FontFamily.ntype,
            fontSize: FontSize.base,
          },
          blockquote: {
            marginLeft: 0,
            padding: 16,
            paddingHorizontal: 16,
            backgroundColor: `${foreground}0D`, // 5% Opacity
            borderRadius: 12,
            borderLeftWidth: 0,
          },
          code_inline: {
            backgroundColor: `${foreground}26`, // 15% Opacity
            borderWidth: 0,
            color: foreground,
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
            textKey="settings.related.appDownload"
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
              textKey="settings.related.appUpdate"
              className="text-center text-xs"
            />
          </Button>
        ) : null}
      </View>
    </ScrollView>
  );
}
