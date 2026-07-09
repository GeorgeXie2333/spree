import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import { ContactPage } from "@/components/cenwatch/pages/ContactPage";
import { OperationInstructionsPage } from "@/components/cenwatch/pages/OperationInstructionsPage";
import { OrderTrackingPage } from "@/components/cenwatch/pages/OrderTrackingPage";
import { siteConfig } from "@/lib/site-config";
import enMessages from "../../../../../messages/en.json";
import zhMessages from "../../../../../messages/zh.json";

function renderWithMessages(
  ui: React.ReactElement,
  locale: "en" | "zh" = "en",
) {
  const messages = locale === "zh" ? zhMessages : enMessages;
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("Support content pages", () => {
  it("renders localized operation instructions from next-intl messages", () => {
    renderWithMessages(<OperationInstructionsPage />, "zh");

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: zhMessages.guide.title,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(zhMessages.guide.intro)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: zhMessages.guide.connectionTitle,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(zhMessages.guide.connectionStep1),
    ).toBeInTheDocument();
  });

  it("renders an accessible contact form that sends through mailto", () => {
    renderWithMessages(<ContactPage />);

    const form = screen.getByRole("form", { name: enMessages.contact.title });
    expect(form).toHaveAttribute("action", `mailto:${siteConfig.supportEmail}`);
    expect(screen.getByLabelText(enMessages.contact.nameLabel)).toHaveAttribute(
      "name",
      "name",
    );
    expect(
      screen.getByLabelText(enMessages.contact.emailLabel),
    ).toHaveAttribute("type", "email");
    expect(
      screen.getByRole("button", { name: enMessages.contact.submit }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        enMessages.contact.emailFallback.replace(
          "{email}",
          siteConfig.supportEmail,
        ),
      ),
    ).toBeInTheDocument();
  });

  it("renders order tracking against the exact-match API without fake order status", () => {
    renderWithMessages(<OrderTrackingPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: enMessages.tracking.title,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(enMessages.tracking.orderNumberLabel),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(enMessages.tracking.emailLabel),
    ).toHaveAttribute("type", "email");
    expect(
      screen.getByRole("button", { name: enMessages.tracking.submit }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/delivered/i)).not.toBeInTheDocument();
  });
});
