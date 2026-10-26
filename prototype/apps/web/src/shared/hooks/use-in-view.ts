import { useEffect, useState } from 'react';

export type InView<T extends Element> = { readonly ref: (node: T | null) => void; readonly seen: boolean };

export function useInView<T extends Element>(): InView<T> {
  const [node, setNode] = useState<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (node === null || seen) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setSeen(true);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, seen]);
  return { ref: setNode, seen };
}
