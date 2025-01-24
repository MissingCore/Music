import { Stack, usePathname } from "expo-router";
import { useAtomValue } from "jotai";

import { prevRouteAtom } from "~/providers/RouteHandlers";
import { IssueLayout } from "~/layouts/Issue";

import { List, ListItem } from "~/components/Containment/List";

/** Screen for unmatched route. */
export default function NotFoundScreen() {
  const pathname = usePathname();
  const prevRoute = useAtomValue(prevRouteAtom);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <IssueLayout issueType="unmatched">
        <List>
          <ListItem
            titleKey="errorScreen.missing"
            description={pathname}
            first
          />
          <ListItem titleKey="errorScreen.from" description={prevRoute} last />
        </List>
      </IssueLayout>
    </>
  );
}
