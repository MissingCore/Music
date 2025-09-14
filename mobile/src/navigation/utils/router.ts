import { createNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef();

export const router = {
  back: () => {},
  navigate: (href: string) => {},
  push: (href: string) => {},
  replace: (href: string) => {},
};
