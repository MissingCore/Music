import { Navigation } from "./navigation/routes";
import { navigationRef } from "./navigation/utils/router";

export default function App() {
  return <Navigation ref={navigationRef} />;
}
