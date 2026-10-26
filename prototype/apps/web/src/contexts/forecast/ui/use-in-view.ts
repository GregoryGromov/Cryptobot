import { useEffect, useState } from 'react';

const MARGIN = '240px 0px';

export function useInView<T extends Element>(): {
  readonly ref: (node: T | null) => void;
  readonly node: T | null;
  readonly visible: boolean;
} {
  const [node, setNode] = useState<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (node === null) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.at(-1);
        if (entry) setVisible(entry.isIntersecting);
      },
      { rootMargin: MARGIN },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return { ref: setNode, node, visible };
}
