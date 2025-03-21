import type { Href } from "expo-router";
import { Stack } from "expo-router";

import { useNavigationStore } from "~/services/NavigationStore";
import { IssueLayout } from "~/layouts/Issue";

import { List, ListItem } from "~/components/Containment/List";

/** Screen for unmatched route. */
export default function NotFoundScreen() {
  const history = useNavigationStore((state) => state.history);
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <IssueLayout issueType="route">
        <List>
          <ListItem
            titleKey="err.flow.route.extra.missing"
            description={asString(history.at(-1))}
            first
          />
          <ListItem
            titleKey="err.flow.route.extra.from"
            description={asString(history.at(-2))}
            last
          />
        </List>
      </IssueLayout>
    </>
  );
}

/** Return `Href` as a string. */
function asString(href: Href | undefined) {
  if (href === undefined) return undefined;
  else if (typeof href === "string") return href;
  return JSON.stringify(href);
}
