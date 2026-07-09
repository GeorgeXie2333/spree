import { NextResponse } from "next/server";

const GENERIC_FAILURE = "We could not find an order matching those details.";
const UNAVAILABLE = "Order tracking is temporarily unavailable.";

type TrackingShipment = {
  status?: unknown;
  tracking_number?: unknown;
  tracking_url?: unknown;
  carrier?: unknown;
};

type TrackingBackendResponse = {
  ok?: unknown;
  order_number?: unknown;
  order_status?: unknown;
  payment_state?: unknown;
  shipment_state?: unknown;
  shipments?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function stringValue(value: unknown): string | undefined {
  return isNonEmptyString(value) ? value.trim() : undefined;
}

function sanitizeShipment(shipment: TrackingShipment) {
  return {
    ...(stringValue(shipment.status)
      ? { status: stringValue(shipment.status) }
      : {}),
    ...(stringValue(shipment.tracking_number)
      ? { tracking_number: stringValue(shipment.tracking_number) }
      : {}),
    ...(stringValue(shipment.tracking_url)
      ? { tracking_url: stringValue(shipment.tracking_url) }
      : {}),
    ...(stringValue(shipment.carrier)
      ? { carrier: stringValue(shipment.carrier) }
      : {}),
  };
}

function genericFailure(status = 200) {
  return NextResponse.json({ ok: false, message: GENERIC_FAILURE }, { status });
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return genericFailure(400);
  }

  const orderNumber =
    typeof payload === "object" && payload !== null
      ? stringValue((payload as Record<string, unknown>).order_number)
      : undefined;
  const email =
    typeof payload === "object" && payload !== null
      ? stringValue((payload as Record<string, unknown>).email)?.toLowerCase()
      : undefined;

  if (!orderNumber || !email) {
    return genericFailure(400);
  }

  const upstreamUrl = process.env.ORDER_TRACKING_API_URL;
  if (!upstreamUrl) {
    return NextResponse.json(
      {
        ok: false,
        message: UNAVAILABLE,
      },
      { status: 503 },
    );
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(process.env.ORDER_TRACKING_API_SECRET
          ? {
              "x-order-tracking-secret": process.env.ORDER_TRACKING_API_SECRET,
            }
          : {}),
      },
      body: JSON.stringify({ order_number: orderNumber, email }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: UNAVAILABLE },
      { status: 503 },
    );
  }

  if (!upstreamResponse.ok) {
    return genericFailure();
  }

  let upstreamJson: TrackingBackendResponse;
  try {
    upstreamJson = (await upstreamResponse.json()) as TrackingBackendResponse;
  } catch {
    return genericFailure();
  }

  if (upstreamJson.ok !== true) {
    return genericFailure();
  }

  const sanitizedShipments = Array.isArray(upstreamJson.shipments)
    ? upstreamJson.shipments
        .filter(
          (shipment): shipment is TrackingShipment =>
            typeof shipment === "object" && shipment !== null,
        )
        .map(sanitizeShipment)
    : [];

  return NextResponse.json({
    ok: true,
    order_number: stringValue(upstreamJson.order_number) ?? orderNumber,
    ...(stringValue(upstreamJson.order_status)
      ? { order_status: stringValue(upstreamJson.order_status) }
      : {}),
    ...(stringValue(upstreamJson.payment_state)
      ? { payment_state: stringValue(upstreamJson.payment_state) }
      : {}),
    ...(stringValue(upstreamJson.shipment_state)
      ? { shipment_state: stringValue(upstreamJson.shipment_state) }
      : {}),
    shipments: sanitizedShipments,
  });
}
