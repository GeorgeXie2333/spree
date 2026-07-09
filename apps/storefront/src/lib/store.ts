const DEFAULT_STORE_URL = "https://shop.cenwatch.com";
const DEFAULT_STORE_NAME = "CenWatch";
const DEFAULT_STORE_DESCRIPTION =
  "The air touch watch for controlling screens, rooms, smart devices, and AR experiences.";

/**
 * Ensure a URL has a protocol prefix.
 * If the URL doesn't start with http:// or https://, prepend https://.
 */
export function ensureProtocol(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Get the public storefront URL for SEO, email links, robots, and sitemap.
 */
export function getStoreUrl(): string | undefined {
  const raw =
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  if (raw) return ensureProtocol(raw);
  return process.env.NODE_ENV === "development"
    ? "http://localhost:3001"
    : DEFAULT_STORE_URL;
}

/**
 * Get the store name from environment variables.
 */
export function getStoreName(): string {
  return process.env.NEXT_PUBLIC_STORE_NAME || DEFAULT_STORE_NAME;
}

/**
 * Get the store description from environment variables.
 */
export function getStoreDescription(): string {
  return process.env.NEXT_PUBLIC_STORE_DESCRIPTION || DEFAULT_STORE_DESCRIPTION;
}

/**
 * Get the default country ISO code (lowercase).
 */
export function getDefaultCountry(): string {
  return (process.env.NEXT_PUBLIC_DEFAULT_COUNTRY || "us").toLowerCase();
}

/**
 * Get the default locale code.
 */
export function getDefaultLocale(): string {
  return process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "en";
}

/**
 * Get the SEO title, preferring STORE_SEO_TITLE and falling back to the
 * store name (NEXT_PUBLIC_STORE_NAME).
 */
export function getStoreSeoTitle(): string {
  return process.env.STORE_SEO_TITLE || `${getStoreName()} - Air Touch Watch`;
}

/**
 * Get the meta description, preferring STORE_META_DESCRIPTION and falling
 * back to the store description (NEXT_PUBLIC_STORE_DESCRIPTION).
 */
export function getStoreMetaDescription(): string {
  return process.env.STORE_META_DESCRIPTION || getStoreDescription();
}

/**
 * Get the "from" address for transactional emails.
 */
export function getStoreEmailFrom(): string {
  return process.env.EMAIL_FROM || "CenWatch <orders@cenwatch.com>";
}

/**
 * Returns true when EMAIL_FROM is not set and getStoreEmailFrom() will
 * return the fallback address.
 */
export function isStoreEmailFromFallback(): boolean {
  return !process.env.EMAIL_FROM;
}
