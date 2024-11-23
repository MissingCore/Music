import { Stack, usePathname } from "expo-router";
import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";

import { prevRouteAtom } from "@/providers/RouteHandlers";
import { IssueLayout } from "@/layouts";

import { List, ListItem } from "@/components/Containment";

/** Screen for unmatched route. */
export default function NotFoundScreen() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const prevRoute = useAtomValue(prevRouteAtom);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <IssueLayout issueType="unmatched">
        <List>
          <ListItem
            title={t("errorScreen.missing")}
            description={pathname}
            first
          />
          <ListItem
            title={t("errorScreen.from")}
            description={prevRoute}
            last
          />
        </List>
      </IssueLayout>
    </>
  );
}
