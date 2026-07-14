import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ORDER_TRACKING_UPSTREAM_TIMEOUT_MS, POST } from "../route";

const originalEnv = {
  upstream: process.env.ORDER_TRACKING_API_URL,
  redisUrl: process.env.UPSTASH_REDIS_REST_URL,
  redisToken: process.env.UPSTASH_REDIS_REST_TOKEN,
  trustedIpHeader: process.env.ORDER_TRACKING_TRUSTED_IP_HEADER,
};

const REDIS_URL = "https://redis.example.com";

function redisResponse(counts = [1, 1]) {
  return new Response(JSON.stringify({ result: counts }));
}

function jsonRequest(body: unknown, clientIp?: string) {
  return new Request("https://shop.cenwatch.com/api/v3/store/order_tracking", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      ...(clientIp ? { "x-forwarded-for": clientIp } : {}),
    },
  });
}

describe("order tracking API", () => {
  beforeEach(() => {
    process.env.UPSTASH_REDIS_REST_URL = REDIS_URL;
    process.env.UPSTASH_REDIS_REST_TOKEN = "redis-token";
    delete process.env.ORDER_TRACKING_TRUSTED_IP_HEADER;
  });

  afterEach(() => {
    const values = [
      ["ORDER_TRACKING_API_URL", originalEnv.upstream],
      ["UPSTASH_REDIS_REST_URL", originalEnv.redisUrl],
      ["UPSTASH_REDIS_REST_TOKEN", originalEnv.redisToken],
      ["ORDER_TRACKING_TRUSTED_IP_HEADER", originalEnv.trustedIpHeader],
    ] as const;
    for (const [key, value] of values) {
      if (value) process.env[key] = value;
      else delete process.env[key];
    }
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("returns a generic failure when no private tracking backend is configured", async () => {
    delete process.env.ORDER_TRACKING_API_URL;

    const response = await POST(
      jsonRequest({ order_number: "R123456789", email: "buyer@example.com" }),
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      ok: false,
      message: "Order tracking is temporarily unavailable.",
    });
  });

  it("sanitizes successful backend responses to limited tracking fields", async () => {
    process.env.ORDER_TRACKING_API_URL =
      "https://api.cenwatch.com/api/v3/store/order_tracking";
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(redisResponse())
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true,
            order_number: "R123456789",
            order_status: "complete",
            payment_state: "paid",
            shipment_state: "shipped",
            email: "buyer@example.com",
            total: "$299",
            shipments: [
              {
                status: "shipped",
                tracking_number: "TRACK123",
                tracking_url: "https://carrier.example/track/TRACK123",
                carrier: "Carrier",
                private_note: "do not leak",
              },
              {
                status: "shipped",
                tracking_number: "MALICIOUS",
                tracking_url: "javascript:alert('do not render')",
                carrier: "Carrier",
              },
            ],
          }),
        ),
      );

    const response = await POST(
      jsonRequest({ order_number: "R123456789", email: "buyer@example.com" }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      order_number: "R123456789",
      order_status: "complete",
      payment_state: "paid",
      shipment_state: "shipped",
      shipments: [
        {
          status: "shipped",
          tracking_number: "TRACK123",
          tracking_url: "https://carrier.example/track/TRACK123",
          carrier: "Carrier",
        },
        {
          status: "shipped",
          tracking_number: "MALICIOUS",
          carrier: "Carrier",
        },
      ],
    });
  });

  it("maps upstream misses to a generic failure", async () => {
    process.env.ORDER_TRACKING_API_URL =
      "https://api.cenwatch.com/api/v3/store/order_tracking";
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(redisResponse())
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: false }), { status: 404 }),
      );

    const response = await POST(
      jsonRequest({ order_number: "R123456789", email: "wrong@example.com" }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(false);
    expect(body.message).toBe(
      "We could not find an order matching those details.",
    );
  });

  it("aborts a slow upstream request and returns only the generic unavailable response", async () => {
    process.env.ORDER_TRACKING_API_URL =
      "https://api.cenwatch.com/api/v3/store/order_tracking";
    vi.useFakeTimers();
    let markFetchStarted = () => {};
    const fetchStarted = new Promise<void>((resolve) => {
      markFetchStarted = resolve;
    });

    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(redisResponse())
      .mockImplementationOnce((_input, init) => {
        const signal = init?.signal;
        return new Promise((_resolve, reject) => {
          markFetchStarted();
          signal?.addEventListener("abort", () => {
            reject(new Error("upstream timeout details must not leak"));
          });
        });
      });

    const responsePromise = POST(
      jsonRequest(
        { order_number: "R123456789", email: "buyer@example.com" },
        "203.0.113.25",
      ),
    );
    await fetchStarted;
    await vi.advanceTimersByTimeAsync(ORDER_TRACKING_UPSTREAM_TIMEOUT_MS);

    const response = await responsePromise;
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: "Order tracking is temporarily unavailable.",
    });
  });

  it("throttles repeated requests through the shared Redis counter", async () => {
    process.env.ORDER_TRACKING_API_URL =
      "https://api.cenwatch.com/api/v3/store/order_tracking";
    let count = 0;
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation((input) => {
        if (String(input) === REDIS_URL) {
          count += 1;
          return Promise.resolve(redisResponse([count, count]));
        }

        return Promise.resolve(
          new Response(
            JSON.stringify({ ok: true, order_number: "R123456789" }),
          ),
        );
      });
    const requestBody = {
      order_number: "R123456789",
      email: "buyer@example.com",
    };

    const responses = await Promise.all(
      Array.from({ length: 11 }, () =>
        POST(jsonRequest(requestBody, "198.51.100.8")),
      ),
    );

    expect(
      responses.slice(0, 10).every((response) => response.status === 200),
    ).toBe(true);
    expect(responses[10].status).toBe(429);
    expect(responses[10].headers.get("retry-after")).toBe("60");
    await expect(responses[10].json()).resolves.toEqual({
      ok: false,
      message: "We could not find an order matching those details.",
    });
    expect(
      fetchMock.mock.calls.filter(([input]) => String(input) !== REDIS_URL),
    ).toHaveLength(10);
  });

  it("fails closed when the shared rate-limit store is not configured", async () => {
    process.env.ORDER_TRACKING_API_URL =
      "https://api.cenwatch.com/api/v3/store/order_tracking";
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const fetchMock = vi.spyOn(globalThis, "fetch");

    const response = await POST(
      jsonRequest({ order_number: "R123456789", email: "buyer@example.com" }),
    );

    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
