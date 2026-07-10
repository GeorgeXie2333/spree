import { describe, expect, it } from "vitest";
import { getSafeRedirectPath } from "@/lib/utils/path";

describe("getSafeRedirectPath", () => {
  const basePath = "/us/en";

  it("accepts paths inside the active country and locale prefix", () => {
    expect(
      getSafeRedirectPath(
        "/us/en/checkout/cart_123?step=payment#details",
        basePath,
      ),
    ).toBe("/us/en/checkout/cart_123?step=payment#details");
  });

  it.each([
    "javascript:alert(document.domain)",
    "https://evil.example/phish",
    "//evil.example/phish",
    "\\\\evil.example\\phish",
    "/us/zh/account",
    "/us/en/../../admin",
    "/us/en/%5cevil.example",
  ])("rejects unsafe redirect %s", (redirect) => {
    expect(getSafeRedirectPath(redirect, basePath)).toBeNull();
  });

  it("returns null when no redirect was requested", () => {
    expect(getSafeRedirectPath(null, basePath)).toBeNull();
  });
});
