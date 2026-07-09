import type { Product } from "@spree/sdk";

const NEW_PRODUCT_WINDOW_DAYS = 30;

/** True when the current price is lower than original or compare-at price. */
export function isOnSale(product: Product): boolean {
  const currentCents = product.price?.amount_in_cents;
  const originalCents = product.original_price?.amount_in_cents;
  const compareAtCents = product.price?.compare_at_amount_in_cents;

  return (
    (currentCents != null &&
      originalCents != null &&
      currentCents < originalCents) ||
    (compareAtCents != null &&
      currentCents != null &&
      currentCents < compareAtCents)
  );
}

/** Display string for the crossed-out reference price, or null when not on sale. */
export function getStrikethroughPrice(product: Product): string | null {
  if (!isOnSale(product)) return null;
  const displayPrice = product.price?.display_amount;
  return (
    (product.original_price?.display_amount &&
    product.original_price.display_amount !== displayPrice
      ? product.original_price.display_amount
      : product.price?.display_compare_at_amount) ?? null
  );
}

/** True when the product became available within the last 30 days. */
export function isNewProduct(product: Product): boolean {
  if (!product.available_on) return false;
  const availableOn = new Date(product.available_on).getTime();
  if (Number.isNaN(availableOn) || availableOn > Date.now()) return false;
  return (
    Date.now() - availableOn < NEW_PRODUCT_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );
}
