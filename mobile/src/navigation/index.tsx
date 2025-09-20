import { Navigation } from "./routes";
import { linking } from "./utils/linking";
import { navigationRef } from "./utils/router";
import { useNavigationTheme } from "./utils/theme";

export default function NavigationContainer() {
  const theme = useNavigationTheme();
  return <Navigation ref={navigationRef} theme={theme} linking={linking} />;
}
