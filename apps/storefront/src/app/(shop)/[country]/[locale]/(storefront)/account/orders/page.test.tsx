import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OrdersPage from "./page";

const { getOrders } = vi.hoisted(() => ({ getOrders: vi.fn() }));
const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("next/server", () => ({ connection: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect }));

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string, values?: { page?: number }) => {
    const labels: Record<string, string> = {
      orderHistory: "Order History",
      pagination: "Order history pagination",
      previousPage: "Previous page",
      nextPage: "Next page",
      pageNumber: "Page {page}",
    };

    return (labels[key] ?? key).replace("{page}", String(values?.page ?? ""));
  },
}));

vi.mock("@/lib/data/orders", () => ({ getOrders }));

vi.mock("@/components/account/OrderList", () => ({
  OrderList: ({ orders }: { orders: Array<{ id: string }> }) => (
    <div data-testid="order-list">{orders.length}</div>
  ),
}));

function ordersResponse(page: number) {
  return {
    data: [
      {
        id: `order-${page}`,
        completed_at: "2026-07-13T00:00:00Z",
      },
    ],
    meta: {
      page,
      limit: 50,
      count: 125,
      pages: 3,
      from: (page - 1) * 50 + 1,
      to: page * 50,
      in: 125,
      previous: page > 1 ? page - 1 : null,
      next: page < 3 ? page + 1 : null,
    },
  };
}

async function renderPage(page?: string) {
  return render(
    await OrdersPage({
      params: Promise.resolve({ country: "us", locale: "en" }),
      searchParams: Promise.resolve(page ? { page } : {}),
    }),
  );
}

describe("OrdersPage pagination", () => {
  beforeEach(() => {
    getOrders.mockReset();
    redirect.mockClear();
  });

  it("uses the URL page for the middle page and exposes first, current, and last navigation", async () => {
    getOrders
      .mockResolvedValueOnce(ordersResponse(1))
      .mockResolvedValueOnce(ordersResponse(2));
    await renderPage("2");

    await screen.findByTestId("order-list");

    expect(getOrders).toHaveBeenCalledWith({
      page: 2,
      limit: 50,
      sort: "completed_at desc",
      state_eq: "complete",
    });
    expect(screen.getByRole("link", { name: "Page 1" })).toHaveAttribute(
      "href",
      "/us/en/account/orders?page=1",
    );
    expect(screen.getByText("2")).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Page 3" })).toHaveAttribute(
      "href",
      "/us/en/account/orders?page=3",
    );
    expect(screen.getByRole("link", { name: "Previous page" })).toHaveAttribute(
      "href",
      "/us/en/account/orders?page=1",
    );
    expect(screen.getByRole("link", { name: "Next page" })).toHaveAttribute(
      "href",
      "/us/en/account/orders?page=3",
    );
  });

  it("restores the last page from a shared page URL", async () => {
    getOrders
      .mockResolvedValueOnce(ordersResponse(1))
      .mockResolvedValueOnce(ordersResponse(3));
    await renderPage("3");

    await screen.findByTestId("order-list");

    expect(getOrders).toHaveBeenCalledWith({
      page: 3,
      limit: 50,
      sort: "completed_at desc",
      state_eq: "complete",
    });
    expect(screen.getByText("3")).toHaveAttribute("aria-current", "page");
    expect(
      screen.queryByRole("link", { name: "Next page" }),
    ).not.toBeInTheDocument();
  });

  it("redirects an overflowing page to the last valid page", async () => {
    getOrders.mockResolvedValueOnce(ordersResponse(1));

    await expect(
      OrdersPage({
        params: Promise.resolve({ country: "us", locale: "en" }),
        searchParams: Promise.resolve({ page: "9999" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/us/en/account/orders?page=3");

    expect(getOrders).toHaveBeenCalledTimes(1);
    expect(getOrders).toHaveBeenCalledWith({
      page: 1,
      limit: 50,
      sort: "completed_at desc",
      state_eq: "complete",
    });
  });

  it("does not disguise backend failures as pagination redirects", async () => {
    getOrders.mockRejectedValueOnce(new Error("Service unavailable"));

    await expect(
      OrdersPage({
        params: Promise.resolve({ country: "us", locale: "en" }),
        searchParams: Promise.resolve({ page: "2" }),
      }),
    ).rejects.toThrow("Service unavailable");

    expect(redirect).not.toHaveBeenCalled();
  });
});
