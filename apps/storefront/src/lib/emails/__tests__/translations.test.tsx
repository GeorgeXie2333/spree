import { render } from "@react-email/render";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { OrderConfirmationEmail } from "@/lib/emails/order-confirmation";
import { getEmailTranslations } from "@/lib/emails/translations";

describe("email translations", () => {
  it("uses the requested locale for order email subjects", () => {
    const t = getEmailTranslations("zh");

    expect(
      t("orderConfirmation.subject", {
        storeName: "CenWatch",
        orderNumber: "R100",
      }),
    ).toBe("CenWatch 订单确认 #R100");
  });

  it("renders a Chinese order confirmation body", async () => {
    const html = await render(
      createElement(OrderConfirmationEmail, {
        orderNumber: "R100",
        customerName: "",
        items: [],
        displayItemTotal: "$10.00",
        displayDeliveryTotal: "$0.00",
        displayTaxTotal: "$0.00",
        displayTotal: "$10.00",
        translations: getEmailTranslations("zh"),
      }),
    );

    expect(html).toContain("订单摘要");
    expect(html).toContain("您的订单 R100 已确认");
    expect(html).not.toContain("Order Summary");
  });
});
