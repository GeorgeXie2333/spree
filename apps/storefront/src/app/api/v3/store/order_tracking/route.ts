import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

const GENERIC_FAILURE = "We could not find an order matching those details.";
const UNAVAILABLE = "Order tracking is temporarily unavailable.";
export const ORDER_TRACKING_UPSTREAM_TIMEOUT_MS = 5_000;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const RATE_LIMIT_MAX_CLIENT_REQUESTS = 30;
const RATE_LIMIT_MAX_GLOBAL_REQUESTS = 1_000;
const RATE_LIMIT_TIMEOUT_MS = 2_000;

const RATE_LIMIT_SCRIPT = `
local counts = {}
for _, key in ipairs(KEYS) do
  local current = redis.call("INCR", key)
  if current == 1 then
    redis.call("PEXPIRE", key, ARGV[1])
  end
  table.insert(counts, current)
end
return counts
`;

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

function httpTrackingUrl(value: unknown): string | undefined {
  const rawUrl = stringValue(value);
  if (!rawUrl) return undefined;

  try {
    const url = new URL(rawUrl);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function sanitizeShipment(shipment: TrackingShipment) {
  const status = stringValue(shipment.status);
  const trackingNumber = stringValue(shipment.tracking_number);
  const trackingUrl = httpTrackingUrl(shipment.tracking_url);
  const carrier = stringValue(shipment.carrier);

  return {
    ...(status ? { status } : {}),
    ...(trackingNumber ? { tracking_number: trackingNumber } : {}),
    ...(trackingUrl ? { tracking_url: trackingUrl } : {}),
    ...(carrier ? { carrier } : {}),
  };
}

function genericFailure(status = 200) {
  return NextResponse.json({ ok: false, message: GENERIC_FAILURE }, { status });
}

function throttleFailure() {
  return NextResponse.json(
    { ok: false, message: GENERIC_FAILURE },
    {
      status: 429,
      headers: {
        "retry-after": String(RATE_LIMIT_WINDOW_MS / 1_000),
      },
    },
  );
}

function rateLimitKey(scope: string, identifier: string): string {
  const digest = createHash("sha256").update(identifier).digest("hex");
  return `order-tracking:${scope}:${digest}`;
}

function trustedClientIdentifier(request: Request): string | null {
  const header =
    process.env.ORDER_TRACKING_TRUSTED_IP_HEADER?.trim().toLowerCase();
  if (!header || !/^[a-z0-9-]+$/.test(header)) return null;

  return (
    request.headers.get(header)?.split(",")[0]?.trim().slice(0, 128) || null
  );
}

async function isRateLimited(
  request: Request,
  email: string,
): Promise<boolean | null> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!redisUrl || !redisToken) return null;

  const keys = [rateLimitKey("email", email), "order-tracking:global"];
  const limits = [RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_MAX_GLOBAL_REQUESTS];
  const clientIdentifier = trustedClientIdentifier(request);
  if (clientIdentifier) {
    keys.push(rateLimitKey("client", clientIdentifier));
    limits.push(RATE_LIMIT_MAX_CLIENT_REQUESTS);
  }

  try {
    const response = await fetch(redisUrl, {
      method: "POST",
      headers: {
        authorization: `Bearer ${redisToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify([
        "EVAL",
        RATE_LIMIT_SCRIPT,
        String(keys.length),
        ...keys,
        String(RATE_LIMIT_WINDOW_MS),
      ]),
      cache: "no-store",
      signal: AbortSignal.timeout(RATE_LIMIT_TIMEOUT_MS),
    });
    if (!response.ok) return null;

    const payload = (await response.json()) as { result?: unknown };
    if (
      !Array.isArray(payload.result) ||
      payload.result.length !== limits.length ||
      payload.result.some((count) => typeof count !== "number")
    ) {
      return null;
    }

    return payload.result.some((count, index) => count > limits[index]);
  } catch {
    return null;
  }
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

  const rateLimited = await isRateLimited(request, email);
  if (rateLimited === null) {
    return NextResponse.json(
      { ok: false, message: UNAVAILABLE },
      { status: 503 },
    );
  }
  if (rateLimited) return throttleFailure();

  let upstreamResponse: Response;
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    ORDER_TRACKING_UPSTREAM_TIMEOUT_MS,
  );
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
      signal: controller.signal,
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: UNAVAILABLE },
      { status: 503 },
    );
  } finally {
    clearTimeout(timeout);
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
