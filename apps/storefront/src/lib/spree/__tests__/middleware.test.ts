import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { createSpreeMiddleware } from "@/lib/spree/middleware";

function request(
  pathname: string,
  init?: ConstructorParameters<typeof NextRequest>[1],
) {
  return new NextRequest(`https://shop.cenwatch.com${pathname}`, init);
}

describe("createSpreeMiddleware", () => {
  const middleware = createSpreeMiddleware({
    defaultCountry: "us",
    defaultLocale: "en",
    supportedCountries: ["us", "ca"],
    supportedLocales: ["en", "zh"],
  });

  it("redirects bare paths to supported launch country and locale", () => {
    const response = middleware(
      request("/", {
        headers: { "accept-language": "fr-FR,fr;q=0.9,zh;q=0.8" },
      }),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://shop.cenwatch.com/us/zh",
    );
  });

  it("normalizes unsupported legacy locale route segments", () => {
    const response = middleware(request("/us/fr/products"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://shop.cenwatch.com/us/en/products",
    );
  });

  it("normalizes unsupported country route segments", () => {
    const response = middleware(request("/gb/zh/products"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://shop.cenwatch.com/us/zh/products",
    );
  });

  it("injects the normalized locale for layouts on supported routes", () => {
    const response = middleware(request("/us/zh/products"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-cenwatch-locale")).toBe("zh");
  });
});
