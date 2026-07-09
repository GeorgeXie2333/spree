import { notFound } from "next/navigation";

/**
 * Catch-all for unmatched paths under /{country}/{locale}/ so the styled
 * (storefront) not-found page renders with the full header/footer chrome
 * instead of Next's bare root 404.
 */
export default function CatchAllNotFound() {
  notFound();
}
