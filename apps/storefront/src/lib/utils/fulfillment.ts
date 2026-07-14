import type { Order } from "@spree/sdk";

type LineItem = Order["items"][number];

export interface FulfillmentLineItem {
  item: LineItem;
  quantity: number;
  total: string;
  displayTotal: string;
}

interface Allocation {
  fulfillmentId: string;
  quantity: number;
}

function getCurrencyFractionDigits(currency: string, locale: string): number {
  try {
    const fractionDigits = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits;
    return fractionDigits ?? 2;
  } catch {
    return 2;
  }
}

function decimalToMinorUnits(
  amount: string | null | undefined,
  fractionDigits: number,
): number | null {
  if (typeof amount !== "string") return null;

  const match = amount.trim().match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
  if (!match) return null;

  const [, sign, whole, fractional = ""] = match;
  const scale = 10 ** fractionDigits;
  const fraction = fractional
    .padEnd(fractionDigits, "0")
    .slice(0, fractionDigits);
  let minorUnits = Number(whole) * scale + Number(fraction || "0");

  if (!Number.isSafeInteger(minorUnits)) return null;

  if (fractional[fractionDigits] && fractional[fractionDigits] >= "5") {
    minorUnits += 1;
  }

  return sign === "-" ? -minorUnits : minorUnits;
}

function minorUnitsToDecimal(
  minorUnits: number,
  fractionDigits: number,
): string {
  const isNegative = minorUnits < 0;
  const absolute = isNegative ? -minorUnits : minorUnits;
  const scale = 10 ** fractionDigits;
  const whole = Math.floor(absolute / scale);
  const fraction = (absolute % scale).toString().padStart(fractionDigits, "0");

  return `${isNegative ? "-" : ""}${whole}${
    fractionDigits > 0 ? `.${fraction}` : ""
  }`;
}

function formatMinorUnits(
  minorUnits: number,
  currency: string,
  locale: string,
  fractionDigits: number,
): string {
  const amount = minorUnits / 10 ** fractionDigits;

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return minorUnitsToDecimal(minorUnits, fractionDigits);
  }
}

function normalizeQuantity(quantity: number): number {
  return Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 0;
}

function allocateMinorUnits(
  total: number,
  totalQuantity: number,
  allocations: Allocation[],
): number[] {
  const isNegative = total < 0;
  const absoluteTotal = isNegative ? -total : total;
  const basePerUnit = Math.floor(absoluteTotal / totalQuantity);
  let remainder = absoluteTotal % totalQuantity;

  return allocations.map(({ quantity: allocationQuantity }) => {
    const extra = Math.min(remainder, allocationQuantity);
    remainder -= extra;
    const allocated = basePerUnit * allocationQuantity + extra;

    return isNegative ? -allocated : allocated;
  });
}

/**
 * Converts order line items into the quantities and amounts belonging to each
 * fulfillment manifest. A line item may be split across multiple fulfillments.
 */
export function buildFulfillmentLineItems(
  order: Order,
  locale: string,
): Map<string, FulfillmentLineItem[]> {
  const lineItemsByFulfillment = new Map<string, FulfillmentLineItem[]>();
  const fulfillments = order.fulfillments ?? [];

  for (const lineItem of order.items ?? []) {
    const lineItemQuantity = normalizeQuantity(lineItem.quantity);
    if (lineItemQuantity === 0) continue;

    let remainingQuantity = lineItemQuantity;
    const allocations = fulfillments.flatMap((fulfillment) => {
      const manifestQuantity = (fulfillment.items ?? []).reduce(
        (total, manifestItem) =>
          manifestItem.item_id === lineItem.id
            ? total + normalizeQuantity(manifestItem.quantity)
            : total,
        0,
      );
      const quantity = Math.min(manifestQuantity, remainingQuantity);
      remainingQuantity -= quantity;

      return quantity > 0 ? [{ fulfillmentId: fulfillment.id, quantity }] : [];
    });

    if (allocations.length === 0) continue;

    const fractionDigits = getCurrencyFractionDigits(lineItem.currency, locale);
    const total = decimalToMinorUnits(lineItem.total, fractionDigits);
    if (total === null) continue;

    const allocatedTotals = allocateMinorUnits(
      total,
      lineItemQuantity,
      allocations,
    );

    allocations.forEach((allocation, index) => {
      const allocatedTotal = allocatedTotals[index];
      const lineItems =
        lineItemsByFulfillment.get(allocation.fulfillmentId) ?? [];
      lineItems.push({
        item: lineItem,
        quantity: allocation.quantity,
        total: minorUnitsToDecimal(allocatedTotal, fractionDigits),
        displayTotal: formatMinorUnits(
          allocatedTotal,
          lineItem.currency,
          locale,
          fractionDigits,
        ),
      });
      lineItemsByFulfillment.set(allocation.fulfillmentId, lineItems);
    });
  }

  return lineItemsByFulfillment;
}
