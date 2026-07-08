/** Tiempos compartidos del home (Hero, StoryStrip, etc.) — mobile y desktop alineados. */
export const HOME_CAROUSEL_INTERVAL_MS = 8000;
export const HOME_TEXT_FADE_MS = 700;
export const HOME_IMAGE_CROSSFADE_MS = 1400;
export const HOME_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
export const BRANDS_MARQUEE_SECONDS = 45;

/** Clases de fade mobile (misma curva/duración que el texto del Hero). */
export const HOME_MOBILE_FADE_TRANSITION =
  "max-md:transition-[opacity,transform] max-md:duration-[700ms] max-md:ease-[cubic-bezier(0.22,1,0.36,1)] max-md:[-webkit-transition:opacity_700ms_cubic-bezier(0.22,1,0.36,1),transform_700ms_cubic-bezier(0.22,1,0.36,1)] motion-reduce:max-md:transition-none [transform:translateZ(0)]";

function isNode(value: unknown): value is Node {
  return typeof Node !== "undefined" && value instanceof Node;
}

/** Safari iOS puede devolver relatedTarget que no es Node en pointer/blur. */
export function nodeContains(container: Node | null | undefined, target: unknown): boolean {
  if (!container || !isNode(target)) return false;
  return container.contains(target);
}
