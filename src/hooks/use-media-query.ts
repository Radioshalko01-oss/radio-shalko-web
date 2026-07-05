import * as React from "react";

export const MD_BREAKPOINT = 768;
export const LG_BREAKPOINT = 1024;

function getMediaQuery(breakpoint: number, direction: "max" | "min" = "max") {
  if (direction === "max") {
    return `(max-width: ${breakpoint - 1}px)`;
  }
  return `(min-width: ${breakpoint}px)`;
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return !!matches;
}

export function useIsBelowMd() {
  return useMediaQuery(getMediaQuery(MD_BREAKPOINT));
}

export function useIsBelowLg() {
  return useMediaQuery(getMediaQuery(LG_BREAKPOINT));
}
