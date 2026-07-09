/**
 * Static site-wide configuration that doesn't come from the Spree API.
 * Marketing copy lives in messages/*.json (i18n) — only true constants here.
 */
export const siteConfig = {
  brandName: "CenWatch",
  supportEmail: "hello@cenwatch.com",
} as const;
