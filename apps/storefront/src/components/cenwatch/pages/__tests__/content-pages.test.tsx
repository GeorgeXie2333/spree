import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContactPage } from "@/components/cenwatch/pages/ContactPage";
import { OperationInstructionsPage } from "@/components/cenwatch/pages/OperationInstructionsPage";
import { OrderTrackingPage } from "@/components/cenwatch/pages/OrderTrackingPage";
import { getCenwatchContent } from "@/content/cenwatch";

describe("CenWatch content pages", () => {
  it("renders localized operation instructions from typed content", () => {
    const content = getCenwatchContent("zh");

    render(<OperationInstructionsPage content={content} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: content.instructions.title,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(content.instructions.intro)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: content.instructions.sections[0]?.title,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(content.instructions.sections[0]?.body[0] ?? ""),
    ).toBeInTheDocument();
  });

  it("renders an accessible contact form that sends through mailto", () => {
    const content = getCenwatchContent("en");

    render(<ContactPage content={content} />);

    const form = screen.getByRole("form", { name: content.contact.title });
    expect(form).toHaveAttribute(
      "action",
      `mailto:${content.brand.supportEmail}`,
    );
    expect(screen.getByLabelText(content.contact.fields.name)).toHaveAttribute(
      "name",
      "name",
    );
    expect(screen.getByLabelText(content.contact.fields.email)).toHaveAttribute(
      "type",
      "email",
    );
    expect(
      screen.getByRole("button", { name: content.contact.submit }),
    ).toBeInTheDocument();
    expect(screen.getByText(content.contact.emailFallback)).toBeInTheDocument();
  });

  it("renders order tracking against the exact-match API without fake order status", () => {
    const content = getCenwatchContent("en");

    render(<OrderTrackingPage content={content} />);

    expect(
      screen.getByRole("heading", { level: 1, name: content.tracking.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(content.tracking.orderNumber),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(content.tracking.email)).toHaveAttribute(
      "type",
      "email",
    );
    expect(
      screen.getByRole("button", { name: content.tracking.submit }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/delivered/i)).not.toBeInTheDocument();
  });
});
