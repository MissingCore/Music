import { MaterialTopTabs } from "@/layouts";

export default function HomeLayout() {
  return (
    <MaterialTopTabs
      initialRouteName="index"
      backBehavior="history"
      tabBar={() => null}
    >
      <MaterialTopTabs.Screen name="index" />
      <MaterialTopTabs.Screen name="folder" />
      <MaterialTopTabs.Screen name="playlist" />
      <MaterialTopTabs.Screen name="track" />
      <MaterialTopTabs.Screen name="album" />
      <MaterialTopTabs.Screen name="artist" />
    </MaterialTopTabs>
  );
}
