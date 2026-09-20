import * as React from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Accessibility hook: true when the user asked the OS to reduce motion.
 * Character animations must degrade to static state chips when enabled.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia(QUERY);
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
