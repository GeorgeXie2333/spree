import type { Media } from "@spree/sdk";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MediaLightbox } from "@/components/products/MediaLightbox";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) =>
    ({
      openImageZoom: "Open image zoom",
      lightboxClose: "Close lightbox",
      lightboxPrev: "Previous image",
      lightboxNext: "Next image",
    })[key] ?? key,
}));

const images = [
  {
    id: "media-1",
    original_url: "https://cdn.example.com/watch-1.jpg",
    alt: "CenWatch front",
  },
  {
    id: "media-2",
    original_url: "https://cdn.example.com/watch-2.jpg",
    alt: "CenWatch side",
  },
] as Media[];

function renderLightbox() {
  const onClose = vi.fn();
  const onNavigate = vi.fn();
  const pageButton = document.createElement("button");
  pageButton.id = "page-action";
  pageButton.textContent = "Page action";
  document.body.append(pageButton);

  render(
    <MediaLightbox
      images={images}
      activeIndex={0}
      productName="CenWatch"
      onClose={onClose}
      onNavigate={onNavigate}
    />,
  );

  return { onClose, onNavigate, pageButton };
}

describe("MediaLightbox", () => {
  it("traps focus, isolates the page, and closes with Escape", async () => {
    const user = userEvent.setup();
    const { onClose, pageButton } = renderLightbox();

    const closeButton = screen.getByRole("button", {
      name: "Close lightbox",
    });
    const previousButton = screen.getByRole("button", {
      name: "Previous image",
    });
    const nextButton = screen.getByRole("button", { name: "Next image" });

    expect(
      screen.getByRole("dialog", { name: "Open image zoom" }),
    ).toHaveAttribute("aria-modal", "true");
    expect(pageButton).toHaveAttribute("aria-hidden", "true");

    await waitFor(() => expect(closeButton).toHaveFocus());
    await user.tab();
    expect(previousButton).toHaveFocus();
    await user.tab();
    expect(nextButton).toHaveFocus();
    await user.tab();
    expect(closeButton).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);

    pageButton.remove();
  });

  it("closes only when a pointer gesture starts and ends on the backdrop", async () => {
    const user = userEvent.setup();
    const { onClose, pageButton } = renderLightbox();
    const backdrop = screen.getByTestId("media-lightbox-backdrop");

    await user.click(screen.getByAltText("CenWatch front"));
    expect(onClose).not.toHaveBeenCalled();

    await user.pointer([
      { target: backdrop, keys: "[MouseLeft>]" },
      { target: backdrop, keys: "[/MouseLeft]" },
    ]);
    expect(onClose).toHaveBeenCalledTimes(1);

    pageButton.remove();
  });
});
