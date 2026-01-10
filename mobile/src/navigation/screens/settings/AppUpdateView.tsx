import { openBrowserAsync } from "expo-web-browser";
import { useMemo } from "react";
import { Text, View } from "react-native";
import Markdown from "react-native-markdown-display";

import { Info } from "~/resources/icons/Info";
import { LogoGitHub } from "~/resources/icons/LogoGitHub";
import { LogoPlayStore } from "~/resources/icons/LogoPlayStore";
import { usePreferenceStore } from "~/stores/Preference/store";
import { useTheme } from "~/hooks/useTheme";
import { useHasNewUpdate } from "../../hooks/useHasNewUpdate";
import { StandardScrollLayout } from "../../layouts/StandardScroll";

import * as LINKS from "~/constants/Links";
import { FontSize } from "~/constants/Styles";
import { getFont } from "~/lib/style";
import { SegmentedList } from "~/components/List/Segmented";
import { AccentText } from "~/components/Typography/AccentText";

export default function AppUpdate() {
  const { release, isRC } = useHasNewUpdate();
  const { scheme, onSurface } = useTheme();
  const accentFont = usePreferenceStore((s) => s.accentFont);
  const primaryFont = usePreferenceStore((s) => s.primaryFont);

  // Remove the special strings for GitHub code blocks.
  const parsedReleaseNotes = useMemo(() => {
    if (!release?.releaseNotes) return "";
    return release.releaseNotes.replaceAll(
      /> \[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)][ \t]*(\r\n)/g,
      "",
    );
  }, [release?.releaseNotes]);

  if (!release) return null;

  // Light: 5% Opacity; Dark: 15% Opacity
  const codeBg = `${onSurface}${scheme === "dark" ? "26" : "0D"}`;

  return (
    <StandardScrollLayout>
      <SegmentedList.CustomItem className="gap-4 p-4">
        <AccentText className="text-xl" originalText>
          {release.version}
        </AccentText>

        <Markdown
          style={{
            body: {
              gap: 12,
              fontFamily: getFont(primaryFont),
              fontSize: 12,
              color: `${onSurface}99`,
            },
            heading2: {
              color: onSurface,
              fontFamily: getFont(accentFont),
              fontSize: FontSize.base,
            },
            fence: {
              padding: 16,
              backgroundColor: `${onSurface}0D`, // 5% Opacity
              borderRadius: 12,
              borderLeftWidth: 0,
            },
            hr: {
              backgroundColor: `${onSurface}1A`, // 10% Opacity
            },
            paragraph: {
              marginTop: 0,
              marginBottom: 0,
            },
          }}
          rules={{
            blockquote: (node, children, _parent, _styles) => (
              <SegmentedList.CustomItem
                key={node.key}
                style={{ backgroundColor: codeBg }}
                className="gap-1 p-2"
              >
                <Info size={20} color={`${onSurface}99`} />
                {children}
              </SegmentedList.CustomItem>
            ),
            // Override the 'code' rule to render code blocks as plain text.
            code_inline: (node, _children, _parent, _styles) => (
              <View
                key={node.key}
                style={{ backgroundColor: codeBg }}
                className="translate-y-0.5 rounded-xs px-1"
              >
                <Text
                  style={{ fontFamily: "monospace" }}
                  className="text-left text-xxs text-onSurface/60"
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
          {parsedReleaseNotes}
        </Markdown>
      </SegmentedList.CustomItem>

      <SegmentedList>
        <SegmentedList.Item
          labelTextKey="feat.appUpdate.extra.downloadAPK"
          onPress={() =>
            openBrowserAsync(`${LINKS.GITHUB}/releases/tag/${release.version}`)
          }
          LeftElement={<LogoGitHub />}
          className="gap-4"
        />
        {!isRC ? (
          <SegmentedList.Item
            labelTextKey="feat.appUpdate.extra.updateGoogle"
            onPress={() => openBrowserAsync(LINKS.PLAYSTORE)}
            LeftElement={<LogoPlayStore />}
            className="gap-4"
          />
        ) : null}
      </SegmentedList>
    </StandardScrollLayout>
  );
}
