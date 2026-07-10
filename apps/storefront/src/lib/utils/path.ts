/**
 * Extract the /country/locale base path prefix from a pathname.
 * e.g. "/us/en/products" -> "/us/en"
 */
export function extractBasePath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2) return "";
  return `/${segments[0]}/${segments[1]}`;
}

/**
 * Get the path portion after the /country/locale prefix.
 * e.g. "/us/en/products/cenwatch-air" -> "/products/cenwatch-air"
 */
export function getPathWithoutPrefix(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 2) return "";
  return `/${segments.slice(2).join("/")}`;
}

/**
 * Return a redirect path only when it remains inside the active storefront
 * country/locale prefix. Query-string values must never be passed directly to
 * Next.js router methods because schemes such as javascript: are executable.
 */
export function getSafeRedirectPath(
  redirectUrl: string | null,
  basePath: string,
): string | null {
  if (
    !redirectUrl?.startsWith("/") ||
    redirectUrl.startsWith("//") ||
    /\\|%5c/i.test(redirectUrl)
  ) {
    return null;
  }

  const origin = "https://storefront.invalid";
  const url = new URL(redirectUrl, origin);
  const isInsideBasePath =
    url.origin === origin &&
    (url.pathname === basePath || url.pathname.startsWith(`${basePath}/`));

  return isInsideBasePath ? `${url.pathname}${url.search}${url.hash}` : null;
}
