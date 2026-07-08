/** Viewports táctiles / tablet ancha donde WebKit (Android) falla al componer capas. */
export const STABLE_COMPOSITOR_MQ = "(max-width: 1279px), (pointer: coarse)";

/** Solo desktop con mouse: marquee RAF, ken-burns, blur, etc. */
export const DESKTOP_MOTION_MQ = "(min-width: 1280px) and (pointer: fine)";

export function readCompositorStable(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia(STABLE_COMPOSITOR_MQ).matches;
}

export function readDesktopMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(DESKTOP_MOTION_MQ).matches;
}
