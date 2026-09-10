import { useEffect, useRef, useState } from "react";

/**
 * Keeps `ref`'s scroll container pinned to the bottom whenever `deps`
 * change (e.g. new streaming tokens), but stops auto-scrolling as soon
 * as the user manually scrolls away from the bottom — the same
 * behaviour ChatGPT/Claude use so a person can read back through a
 * response while it's still generating.
 */
export function useStickToBottom<T extends HTMLElement>(deps: unknown[]) {
  const ref = useRef<T>(null);
  const [pinned, setPinned] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setPinned(distanceFromBottom < 80);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !pinned) return;
    el.scrollTop = el.scrollHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ref, pinned, scrollToBottom: () => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
    setPinned(true);
  } };
}
