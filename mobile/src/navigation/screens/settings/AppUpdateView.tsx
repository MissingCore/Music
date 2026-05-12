import { useMemo } from "react";
import { Text, View } from "react-native";
import Markdown from "react-native-markdown-renderer";

import { Info } from "~/resources/icons/Info";
import { LogoGitHub } from "~/resources/icons/LogoGitHub";
import { LogoPlayStore } from "~/resources/icons/LogoPlayStore";
import { usePreferenceStore } from "~/stores/Preference/store";

import { useHasNewUpdate } from "~/navigation/hooks/useHasNewUpdate";
import { ListLayout } from "~/navigation/layouts/ListLayout";

import { FontSize } from "~/constants/Styles";
import { Links, openLink } from "~/lib/web-browser";
import { SegmentedList } from "~/components/List/Segmented";
import { AccentText } from "~/components/Typography/AccentText";
import { getFont } from "~/modules/font/utils";
import { useTheme } from "~/modules/theme/hooks";

export default function AppUpdate() {
  const { release, isRC } = useHasNewUpdate();
  const { scheme, onSurface, onSurfaceVariant, outlineVariant } = useTheme();
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
    <ListLayout>
      <SegmentedList.CustomItem className="gap-4 p-4">
        <AccentText className="text-xl" originalText>
          {release.version}
        </AccentText>

        <Markdown
          style={{
            root: { gap: 12 },
            text: {
              color: onSurfaceVariant,
              fontFamily: getFont(primaryFont),
              fontSize: FontSize.xs,
              lineHeight: undefined,
            },
            paragraph: { marginBottom: 0 },
            headingContainer: { marginTop: 0, marginBottom: 0 },
            heading2: {
              color: onSurface,
              fontFamily: getFont(accentFont, { headline: true }),
              fontSize: FontSize.base,
            },
            heading2Container: { paddingBottom: 0, borderBottomWidth: 0 },
            link: { color: onSurfaceVariant, textDecorationLine: "underline" },
            codeBlock: {
              backgroundColor: `${onSurface}0D`, // 5% Opacity
              borderRadius: 12,
            },
            hr: { backgroundColor: outlineVariant },
            list: { marginBottom: 0 },
            listItem: { flexWrap: "no-wrap" },
            listOrderedItem: { marginTop: 0 },
            listOrderedItemIcon: { lineHeight: undefined },
            listOrderedItemText: { lineHeight: undefined },
            listUnorderedItem: { marginTop: 0 },
            listUnorderedItemIcon: { lineHeight: undefined },
            listUnorderedItemText: { lineHeight: undefined },
          }}
          rules={{
            blockquote: (node, children, _parent, _styles) => (
              <SegmentedList.CustomItem
                key={node.key}
                style={{ backgroundColor: codeBg }}
                className="gap-1 p-2"
              >
                <Info size={20} color="onSurfaceVariant" />
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
                  className="text-left text-xxs text-onSurfaceVariant"
                >
                  {node.content}
                </Text>
              </View>
            ),
            link: (node, children, _parent, styles) => (
              <Text
                key={node.key}
                style={styles.link as any}
                onPress={() => openLink(node.attributes.href!)}
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
          onPress={() => openLink(Links.SpecificRelease(release.version))}
          LeftElement={<LogoGitHub />}
          className="gap-4"
        />
        {!isRC ? (
          <SegmentedList.Item
            labelTextKey="feat.appUpdate.extra.updateGoogle"
            onPress={() => openLink(Links.PlayStore)}
            LeftElement={<LogoPlayStore />}
            className="gap-4"
          />
        ) : null}
      </SegmentedList>
    </ListLayout>
  );
}
