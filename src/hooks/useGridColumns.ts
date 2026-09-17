import { useEffect, useState } from 'react';

/**
 * Mirrors the breakpoints used by VIDEO_GRID_CLASS so shelves can be inserted
 * after a *complete* row, exactly like YouTube does — never mid-row.
 */
function columnsForWidth(width: number): number {
  if (width >= 2100) return 5;
  if (width >= 1700) return 4;
  if (width >= 1024) return 3;
  if (width >= 500) return 2;
  return 1;
}

/** The Shorts shelf packs more, narrower cards across the same width. */
function shortsColumnsForWidth(width: number): number {
  if (width >= 2100) return 8;
  if (width >= 1700) return 6;
  if (width >= 1024) return 5;
  if (width >= 500) return 3;
  return 2;
}

function useResponsiveValue(compute: (width: number) => number, fallback: number): number {
  const [value, setValue] = useState(() =>
  typeof window === 'undefined' ? fallback : compute(window.innerWidth)
  );

  useEffect(() => {
    const update = () => setValue(compute(window.innerWidth));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [compute]);

  return value;
}

export function useGridColumns(): number {
  return useResponsiveValue(columnsForWidth, 3);
}

export function useShortsColumns(): number {
  return useResponsiveValue(shortsColumnsForWidth, 5);
}