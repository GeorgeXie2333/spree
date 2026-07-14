export const POLICY_LINKS = [
  {
    nameKey: "shippingPolicy",
    slug: "shipping-policy",
  },
  {
    nameKey: "privacyPolicy",
    slug: "privacy-policy",
  },
  {
    nameKey: "returnsPolicy",
    slug: "returns-policy",
  },
  {
    nameKey: "termsOfService",
    slug: "terms-of-service",
  },
] as const;

/** Policies shown in the consent checkbox (checkout + registration). */
export const CONSENT_POLICIES = [
  { nameKey: "privacyPolicy", slug: "privacy-policy" },
  { nameKey: "termsOfService", slug: "terms-of-service" },
] as const;
