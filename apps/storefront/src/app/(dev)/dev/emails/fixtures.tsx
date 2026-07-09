import { createElement, type ReactElement } from "react";
import { OrderCanceledEmail } from "@/lib/emails/order-canceled";
import { OrderConfirmationEmail } from "@/lib/emails/order-confirmation";
import { PasswordResetEmail } from "@/lib/emails/password-reset";
import { ShipmentShippedEmail } from "@/lib/emails/shipment-shipped";

interface EmailFixture {
  slug: string;
  label: string;
  render: () => ReactElement;
}

export const emailFixtures: EmailFixture[] = [
  {
    slug: "order-confirmation",
    label: "Order Confirmation",
    render: () =>
      createElement(OrderConfirmationEmail, {
        orderNumber: "R987654321",
        customerName: "Jane Smith",
        items: [
          {
            name: "CenWatch Air",
            slug: "cenwatch-air",
            quantity: 2,
            options_text: "Finish: Midnight",
            display_price: "$199.00",
            display_total: "$398.00",
            thumbnail_url: null,
          },
          {
            name: "CenWatch Air Pro",
            slug: "cenwatch-air-pro",
            quantity: 1,
            options_text: "Finish: Silver",
            display_price: "$249.00",
            display_total: "$249.00",
            thumbnail_url: null,
          },
          {
            name: "CenWatch Air Lite",
            slug: "cenwatch-air-lite",
            quantity: 1,
            options_text: "",
            display_price: "$169.00",
            display_total: "$169.00",
            thumbnail_url: null,
          },
        ],
        displayItemTotal: "$816.00",
        displayDeliveryTotal: "$5.99",
        displayDiscountTotal: "-$10.00",
        displayTaxTotal: "$64.96",
        displayTotal: "$876.95",
        shippingAddress: {
          full_name: "Jane Smith",
          address1: "123 Main Street",
          address2: "Apt 4B",
          city: "New York",
          state_text: "NY",
          postal_code: "10001",
          country_name: "United States",
          phone: "+1 (555) 123-4567",
        },
        billingAddress: {
          full_name: "Jane Smith",
          address1: "123 Main Street",
          address2: "Apt 4B",
          city: "New York",
          state_text: "NY",
          postal_code: "10001",
          country_name: "United States",
        },
        deliveryMethodName: "USPS Priority Mail (2-3 days)",
      }),
  },
  {
    slug: "order-canceled",
    label: "Order Canceled",
    render: () =>
      createElement(OrderCanceledEmail, {
        orderNumber: "R987654321",
        customerName: "Jane Smith",
        items: [
          {
            name: "CenWatch Air",
            slug: "cenwatch-air",
            quantity: 2,
            options_text: "Finish: Midnight",
            display_total: "$398.00",
            thumbnail_url: null,
          },
          {
            name: "CenWatch Air Pro",
            slug: "cenwatch-air-pro",
            quantity: 1,
            options_text: "Finish: Silver",
            display_total: "$249.00",
            thumbnail_url: null,
          },
        ],
        displayTotal: "$647.00",
      }),
  },
  {
    slug: "shipment-shipped",
    label: "Shipment Shipped",
    render: () =>
      createElement(ShipmentShippedEmail, {
        orderNumber: "R987654321",
        customerName: "Jane Smith",
        shipments: [
          {
            number: "H123456789",
            tracking: "1Z999AA10123456784",
            tracking_url:
              "https://tools.usps.com/go/TrackConfirmAction?tLabels=1Z999AA10123456784",
            delivery_method_name: "USPS Priority Mail",
            display_cost: "$5.99",
            items: [
              {
                name: "CenWatch Air",
                slug: "cenwatch-air",
                quantity: 2,
                options_text: "Finish: Midnight",
                thumbnail_url: null,
              },
              {
                name: "CenWatch Air Pro",
                slug: "cenwatch-air-pro",
                quantity: 1,
                options_text: "Finish: Silver",
                thumbnail_url: null,
              },
            ],
          },
        ],
      }),
  },
  {
    slug: "password-reset",
    label: "Password Reset",
    render: () =>
      createElement(PasswordResetEmail, {
        resetUrl:
          "https://shop.cenwatch.com/us/en/account/reset-password?token=preview",
      }),
  },
];

export function getEmailFixture(slug: string): EmailFixture | undefined {
  return emailFixtures.find((f) => f.slug === slug);
}
