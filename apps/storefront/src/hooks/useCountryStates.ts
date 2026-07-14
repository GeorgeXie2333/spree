import type { State } from "@spree/sdk";
import { useEffect, useRef, useState } from "react";

/**
 * Fetches states for a country ISO code, with cleanup on unmount/change.
 * Returns [states, loading].
 */
export function useCountryStates(
  countryIso: string,
  fetchStates: (countryIso: string) => Promise<State[]>,
  enabled = true,
): [State[], boolean] {
  const [states, setStates] = useState<State[]>([]);
  const [isPending, setIsPending] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;

    if (!enabled || !countryIso) {
      setStates([]);
      setIsPending(false);
      return;
    }

    let active = true;
    setStates([]);
    setIsPending(true);

    const isCurrentRequest = () => active && requestId === requestIdRef.current;

    const loadStates = async () => {
      try {
        const result = await fetchStates(countryIso);
        if (isCurrentRequest()) setStates(result);
      } catch {
        if (isCurrentRequest()) setStates([]);
      } finally {
        if (isCurrentRequest()) setIsPending(false);
      }
    };

    void loadStates();

    return () => {
      active = false;
    };
  }, [countryIso, fetchStates, enabled]);

  return [states, isPending];
}
