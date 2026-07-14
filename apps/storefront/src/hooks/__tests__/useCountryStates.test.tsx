import type { State } from "@spree/sdk";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCountryStates } from "../useCountryStates";

function deferred<T>() {
  let resolve: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve: resolve! };
}

describe("useCountryStates", () => {
  it("clears old states, stays pending, and ignores a stale country response", async () => {
    const initialUsRequest = deferred<State[]>();
    const caRequest = deferred<State[]>();
    const finalUsRequest = deferred<State[]>();
    const requests = [
      initialUsRequest.promise,
      caRequest.promise,
      finalUsRequest.promise,
    ];
    const fetchStates = vi.fn(() => requests.shift()!);
    const usStates = [{ abbr: "CA", name: "California" }] as State[];
    const caStates = [{ abbr: "ON", name: "Ontario" }] as State[];

    const { result, rerender } = renderHook(
      ({ countryIso }) => useCountryStates(countryIso, fetchStates),
      { initialProps: { countryIso: "US" } },
    );

    expect(result.current).toEqual([[], true]);

    await act(async () => {
      initialUsRequest.resolve(usStates);
      await initialUsRequest.promise;
    });

    await waitFor(() => {
      expect(result.current).toEqual([usStates, false]);
    });

    rerender({ countryIso: "CA" });

    expect(result.current).toEqual([[], true]);

    rerender({ countryIso: "US" });

    expect(result.current).toEqual([[], true]);

    await act(async () => {
      caRequest.resolve(caStates);
      await caRequest.promise;
    });

    expect(result.current).toEqual([[], true]);

    await act(async () => {
      finalUsRequest.resolve(usStates);
      await finalUsRequest.promise;
    });

    await waitFor(() => {
      expect(result.current).toEqual([usStates, false]);
    });
  });
});
