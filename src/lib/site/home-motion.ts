/** Tiempos compartidos del home (Hero, StoryStrip, etc.) — mobile y desktop alineados. */
export const HOME_CAROUSEL_INTERVAL_MS = 8000;
export const HOME_TEXT_FADE_MS = 700;
export const HOME_IMAGE_CROSSFADE_MS = 1400;
export const HOME_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
export const BRANDS_MARQUEE_SECONDS = 45;

/** Clases de fade táctil (móvil + tablet ancha): solo opacidad para evitar glitches en WebKit. */
export const HOME_TOUCH_FADE_TRANSITION =
  "max-xl:transition-opacity max-xl:duration-[700ms] max-xl:ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:max-xl:transition-none";

/** @deprecated Usar HOME_TOUCH_FADE_TRANSITION */
export const HOME_MOBILE_FADE_TRANSITION = HOME_TOUCH_FADE_TRANSITION;

function isNode(value: unknown): value is Node {
  return typeof Node !== "undefined" && value instanceof Node;
}

/** Safari iOS puede devolver relatedTarget que no es Node en pointer/blur. */
export function nodeContains(container: Node | null | undefined, target: unknown): boolean {
  if (!container || !isNode(target)) return false;
  return container.contains(target);
}
