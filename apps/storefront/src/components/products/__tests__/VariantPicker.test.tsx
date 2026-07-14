import type { OptionType, Variant } from "@spree/sdk";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { VariantPicker } from "../VariantPicker";

vi.mock("next-intl", () => ({
  useTranslations: () => ({
    rich: (_key: string, values: { label: string; value: string }) =>
      `${values.label}: ${values.value}`,
  }),
}));

const optionTypes = [
  { id: "color", label: "Color", kind: "buttons" },
  { id: "size", label: "Size", kind: "buttons" },
] as unknown as OptionType[];

const sparseVariants = [
  {
    id: "red-small",
    purchasable: true,
    option_values: [
      { option_type_id: "color", name: "red", label: "Red" },
      { option_type_id: "size", name: "small", label: "Small" },
    ],
  },
  {
    id: "blue-large",
    purchasable: true,
    option_values: [
      { option_type_id: "color", name: "blue", label: "Blue" },
      { option_type_id: "size", name: "large", label: "Large" },
    ],
  },
] as unknown as Variant[];

function VariantPickerHarness({
  initialVariantId,
}: {
  initialVariantId: string;
}) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    () =>
      sparseVariants.find((variant) => variant.id === initialVariantId) ?? null,
  );

  return (
    <>
      <VariantPicker
        variants={sparseVariants}
        optionTypes={optionTypes}
        selectedVariant={selectedVariant}
        onVariantChange={setSelectedVariant}
      />
      <output data-testid="selected-variant">{selectedVariant?.id}</output>
    </>
  );
}

describe("VariantPicker", () => {
  it("switches from red/small to the reachable blue/large variant", async () => {
    const user = userEvent.setup();
    render(<VariantPickerHarness initialVariantId="red-small" />);

    const blue = screen.getByRole("button", { name: "Blue" });
    expect(blue).toBeEnabled();

    await user.click(blue);

    expect(screen.getByTestId("selected-variant")).toHaveTextContent(
      "blue-large",
    );
    expect(screen.getByRole("button", { name: "Large" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("switches from blue/large to the reachable red/small variant", async () => {
    const user = userEvent.setup();
    render(<VariantPickerHarness initialVariantId="blue-large" />);

    const small = screen.getByRole("button", { name: "Small" });
    expect(small).toBeEnabled();

    await user.click(small);

    expect(screen.getByTestId("selected-variant")).toHaveTextContent(
      "red-small",
    );
    expect(screen.getByRole("button", { name: "Red" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
