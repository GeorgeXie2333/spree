import { type NextRequest, NextResponse } from "next/server";

const COUNTRY_COOKIE = "spree_country";
const LOCALE_COOKIE = "spree_locale";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

const HAS_COUNTRY_LOCALE = /^\/([a-z]{2})\/([a-z]{2})(\/|$)/i;

export interface SpreeMiddlewareConfig {
  defaultCountry?: string;
  defaultLocale?: string;
  supportedCountries?: string[];
  supportedLocales?: string[];
  staticRoutes?: string[];
}

function setLocaleCookies(
  response: NextResponse,
  country: string,
  locale: string,
): void {
  response.cookies.set(COUNTRY_COOKIE, country, {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

function redirectWithLocale(
  request: NextRequest,
  pathname: string,
  country: string,
  locale: string,
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const response = NextResponse.redirect(url);
  response.headers.set("x-cenwatch-locale", locale);
  setLocaleCookies(response, country, locale);
  return response;
}

function nextWithLocale(
  request: NextRequest,
  country: string,
  locale: string,
): NextResponse {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-cenwatch-locale", locale);
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set("x-cenwatch-locale", locale);
  setLocaleCookies(response, country, locale);
  return response;
}

function normalizeList(values: string[]): string[] {
  return values.map((value) => value.toLowerCase());
}

function normalizeSupported(
  value: string | undefined,
  supported: string[],
  fallback: string,
): string {
  const normalized = value?.toLowerCase();
  return normalized && supported.includes(normalized) ? normalized : fallback;
}

function pickAcceptedLocale(
  acceptLanguage: string | null,
  supportedLocales: string[],
  fallback: string,
): string {
  if (!acceptLanguage) return fallback;

  for (const item of acceptLanguage.split(",")) {
    const primary = item.split(";")[0]?.trim().split("-")[0]?.toLowerCase();
    if (primary && supportedLocales.includes(primary)) {
      return primary;
    }
  }

  return fallback;
}

export function createSpreeMiddleware(
  config: SpreeMiddlewareConfig = {},
): (request: NextRequest) => NextResponse {
  const defaultCountry = (config.defaultCountry ?? "us").toLowerCase();
  const defaultLocale = (config.defaultLocale ?? "en").toLowerCase();
  const supportedCountries = normalizeList(
    config.supportedCountries ?? [defaultCountry],
  );
  const supportedLocales = normalizeList(
    config.supportedLocales ?? [defaultLocale],
  );
  const staticRoutes = config.staticRoutes ?? [
    "/_next",
    "/api",
    "/dev",
    "/favicon.ico",
  ];

  return function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (staticRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    if (/\.\w+$/.test(pathname)) {
      return NextResponse.next();
    }

    const match = pathname.match(HAS_COUNTRY_LOCALE);
    if (match) {
      const normalizedCountry = normalizeSupported(
        match[1],
        supportedCountries,
        defaultCountry,
      );
      const normalizedLocale = normalizeSupported(
        match[2],
        supportedLocales,
        defaultLocale,
      );

      if (
        normalizedCountry !== match[1].toLowerCase() ||
        normalizedLocale !== match[2].toLowerCase()
      ) {
        const suffix = pathname.slice(`/${match[1]}/${match[2]}`.length);
        return redirectWithLocale(
          request,
          `/${normalizedCountry}/${normalizedLocale}${suffix}`,
          normalizedCountry,
          normalizedLocale,
        );
      }

      return nextWithLocale(request, normalizedCountry, normalizedLocale);
    }

    const country = normalizeSupported(
      request.cookies.get(COUNTRY_COOKIE)?.value ??
        request.headers.get("x-vercel-ip-country")?.toLowerCase() ??
        request.headers.get("cf-ipcountry")?.toLowerCase(),
      supportedCountries,
      defaultCountry,
    );

    const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
    const locale = cookieLocale
      ? normalizeSupported(cookieLocale, supportedLocales, defaultLocale)
      : pickAcceptedLocale(
          request.headers.get("accept-language"),
          supportedLocales,
          defaultLocale,
        );

    return redirectWithLocale(
      request,
      `/${country}/${locale}${pathname === "/" ? "" : pathname}`,
      country,
      locale,
    );
  };
}
