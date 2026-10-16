import { useWindowDimensions } from "react-native";

import { breakpoints } from "../theme/tokens";

export function useLayout() {
  const { width } = useWindowDimensions();
  const isMobile = width < breakpoints.tablet;
  const isTablet = width >= breakpoints.tablet && width < breakpoints.desktop;
  const isDesktop = width >= breakpoints.desktop;

  return { width, isMobile, isTablet, isDesktop };
}