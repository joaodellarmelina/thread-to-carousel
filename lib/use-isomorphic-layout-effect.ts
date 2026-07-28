import { useEffect, useLayoutEffect } from "react";

/**
 * useLayoutEffect fires synchronously before paint (no visible one-frame lag),
 * but warns when it runs during SSR. These components only ever measure real
 * layout on the client, so fall back to useEffect there and avoid the warning.
 */
export const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
