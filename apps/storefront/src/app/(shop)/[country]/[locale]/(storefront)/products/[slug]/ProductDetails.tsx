"use client";

import type { Media, Product, Variant } from "@spree/sdk";
import { Loader2, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Price } from "@/components/commerce/Price";
import { ProductBadge } from "@/components/commerce/ProductBadge";
import { MediaGallery } from "@/components/products/MediaGallery";
import { PdpAccordion } from "@/components/products/PdpAccordion";
import { ProductCustomFields } from "@/components/products/ProductCustomFields";
import { StickyBuyBar } from "@/components/products/StickyBuyBar";
import { VariantPicker } from "@/components/products/VariantPicker";
import { Button } from "@/components/ui/button";
import { QuantityPicker } from "@/components/ui/quantity-picker";
import { useCart } from "@/contexts/CartContext";
import { useStore } from "@/contexts/StoreContext";
import { trackAddToCart, trackViewItem } from "@/lib/analytics/gtm";
import { isNewProduct } from "@/lib/commerce";

const ExpressCheckoutButton = dynamic(
  () =>
    import("@/components/checkout/ExpressCheckoutButton").then((m) => ({
      default: m.ExpressCheckoutButton,
    })),
  { ssr: false },
);

/** Tailwind scope styling admin-authored description HTML (no typography plugin). */
const DESCRIPTION_HTML_CLASSES =
  "text-sm leading-relaxed text-muted-foreground [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_a]:text-link [&_a]:underline [&_strong]:font-semibold [&_strong]:text-foreground [&_em]:italic [&_h1]:my-3 [&_h1]:text-base [&_h1]:font-semibold [&_h1]:text-foreground [&_h2]:my-3 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:my-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4";

/** Preorder fields exist on newer Store API payloads; published SDK 1.1.0
 * types omit them. Read optionally so the UI works when the API returns them. */
type PreorderFields = {
  preorder?: boolean;
  preorder_ships_at?: string | null;
};

function readPreorder(
  variant: Variant | null,
  product: Product,
): { isPreorder: boolean; shipsAt: string | null } {
  const fromVariant = variant as (Variant & PreorderFields) | null;
  const fromProduct = product as Product & PreorderFields;
  return {
    isPreorder: fromVariant?.preorder ?? fromProduct.preorder ?? false,
    shipsAt:
      fromVariant?.preorder_ships_at ?? fromProduct.preorder_ships_at ?? null,
  };
}

interface ProductDetailsProps {
  product: Product;
  basePath: string;
}

export function ProductDetails({ product, basePath }: ProductDetailsProps) {
  const { addItem, cart } = useCart();
  const { currency } = useStore();
  const locale = useLocale();
  const t = useTranslations("products");
  const tPdp = useTranslations("pdp");

  // Filter variants list
  const variants = useMemo(() => {
    return (product.variants || []).filter(Boolean);
  }, [product.variants]);

  const hasVariants = variants.length > 0;
  const optionTypes = product.option_types || [];

  // Initialize with default variant or first available variant
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(() => {
    if (product.default_variant) {
      return product.default_variant;
    }
    if (hasVariants) {
      return variants.find((v) => v.purchasable) || variants[0];
    }
    // For products without variants, use default variant
    return product.default_variant || null;
  });

  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  // Track product view (analytics - client-only side effect)
  useEffect(() => {
    trackViewItem(product, currency);
  }, [product, currency]);

  const galleryImages = useMemo((): Media[] => {
    return product.media || [];
  }, [product.media]);

  const variantImageIndex = useMemo((): number | null => {
    if (!selectedVariant) return null;
    const index = galleryImages.findIndex((m) =>
      m.variant_ids.includes(selectedVariant.id),
    );
    return index >= 0 ? index : null;
  }, [selectedVariant, galleryImages]);

  const price = selectedVariant?.price ?? product.price;
  const originalPrice =
    selectedVariant?.original_price ?? product.original_price;
  const displayPrice = price?.display_amount;

  const currentAmountCents = price?.amount_in_cents;
  const originalAmountCents = originalPrice?.amount_in_cents;
  const compareAtAmountCents = price?.compare_at_amount_in_cents;
  const onSale =
    (currentAmountCents != null &&
      originalAmountCents != null &&
      currentAmountCents < originalAmountCents) ||
    (compareAtAmountCents != null &&
      currentAmountCents != null &&
      currentAmountCents < compareAtAmountCents);

  const strikethroughPrice = onSale
    ? ((originalPrice?.display_amount &&
      originalPrice.display_amount !== displayPrice
        ? originalPrice.display_amount
        : price?.display_compare_at_amount) ?? null)
    : null;

  // EU Omnibus lowest-recent-price note (PriceHistory)
  const priorPrice = selectedVariant?.prior_price ?? product.prior_price;

  // Purchasability
  const isPurchasable = hasVariants
    ? (selectedVariant?.purchasable ?? false)
    : (product.purchasable ?? false);

  const inStock = hasVariants
    ? (selectedVariant?.in_stock ?? false)
    : (product.in_stock ?? false);

  const { isPreorder, shipsAt: preorderShipsAt } = readPreorder(
    selectedVariant,
    product,
  );

  const preorderShipsAtLabel = useMemo(() => {
    if (!preorderShipsAt) return null;
    const date = new Date(preorderShipsAt);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(date);
  }, [preorderShipsAt, locale]);

  const isNew = isNewProduct(product);

  // Sticky buy bar visibility: show once the main Add to Cart button has
  // been scrolled past (not merely below the fold on initial load).
  const addToCartRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const el = addToCartRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyBar(
          !entry.isIntersecting && entry.boundingClientRect.top < 0,
        );
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleAddToCart = async () => {
    const variantId =
      selectedVariant?.id ||
      product.default_variant?.id ||
      product.default_variant_id;
    if (!variantId) {
      throw new Error("No variant selected");
    }

    setLoading(true);
    await addItem(variantId, quantity);
    setLoading(false);
    trackAddToCart(product, selectedVariant, quantity, currency);
  };

  const skuOrOptionRows =
    selectedVariant?.sku || selectedVariant?.options_text ? (
      <dl className="grid grid-cols-[minmax(7rem,11rem)_1fr] gap-x-6 gap-y-2.5">
        {selectedVariant?.sku && (
          <div className="contents">
            <dt className="text-sm text-muted-foreground">{t("sku")}</dt>
            <dd className="min-w-0 text-sm text-foreground">
              {selectedVariant.sku}
            </dd>
          </div>
        )}
        {selectedVariant?.options_text && (
          <div className="contents">
            <dt className="text-sm text-muted-foreground">{t("options")}</dt>
            <dd className="min-w-0 text-sm text-foreground">
              {selectedVariant.options_text}
            </dd>
          </div>
        )}
      </dl>
    ) : null;

  const hasSpecifications =
    !!skuOrOptionRows || (product.custom_fields?.length ?? 0) > 0;

  const descriptionHtml = product.description_html ?? product.description;

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
        {/* Media Gallery */}
        <div>
          <MediaGallery
            images={galleryImages}
            productName={product.name}
            activeIndex={variantImageIndex}
          />
        </div>

        {/* Buy box */}
        <div className="lg:sticky lg:top-[100px] lg:self-start">
          {onSale ? (
            <ProductBadge variant="sale">{t("sale")}</ProductBadge>
          ) : isPreorder ? (
            <ProductBadge variant="preorder">{tPdp("preorder")}</ProductBadge>
          ) : isNew ? (
            <ProductBadge variant="new">{t("new")}</ProductBadge>
          ) : null}

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {product.name}
          </h1>

          {/* Price */}
          <div className="mt-4">
            <Price
              amount={displayPrice}
              compareAt={strikethroughPrice}
              size="lg"
            />
            {onSale && priorPrice?.display_amount && (
              <p className="mt-1 text-xs text-muted-foreground">
                {tPdp("lowestPriceNote", { price: priorPrice.display_amount })}
              </p>
            )}
          </div>

          {/* Availability line */}
          <div className="mt-4 text-sm">
            {isPreorder ? (
              <span className="text-link">
                {preorderShipsAtLabel
                  ? tPdp("preorderShipsAt", { date: preorderShipsAtLabel })
                  : tPdp("preorder")}
              </span>
            ) : inStock ? (
              <span className="inline-flex items-center gap-2 text-[#1a7f37]">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full bg-[#1a7f37]"
                />
                {tPdp("inStock")}
              </span>
            ) : (
              <span className="text-muted-foreground">
                {tPdp("outOfStock")}
              </span>
            )}
          </div>

          {/* Variant Picker */}
          {hasVariants && optionTypes.length > 0 && (
            <div className="mt-8">
              <VariantPicker
                variants={variants}
                optionTypes={optionTypes}
                selectedVariant={selectedVariant}
                onVariantChange={setSelectedVariant}
              />
            </div>
          )}

          {/* Quantity + Add to Cart + Express checkout */}
          <div ref={addToCartRef} className="mt-8">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {tPdp("quantity")}
              </span>
              <QuantityPicker
                quantity={quantity}
                onDecrement={() => setQuantity(Math.max(1, quantity - 1))}
                onIncrement={() => setQuantity(quantity + 1)}
              />
            </div>

            <div className="mt-4">
              <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={loading || !isPurchasable}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    {t("adding")}
                  </>
                ) : isPurchasable ? (
                  t("addToCart")
                ) : (
                  tPdp("outOfStock")
                )}
              </Button>
            </div>

            {cart && parseFloat(cart.total) > 0 && (
              <div className="mt-3">
                <ExpressCheckoutButton
                  cart={cart}
                  basePath={basePath}
                  onComplete={() => {}}
                  showDivider={false}
                />
              </div>
            )}
          </div>

          {/* Accordions */}
          <div className="mt-10 border-t border-border">
            {descriptionHtml && (
              <PdpAccordion title={t("description")} defaultOpen>
                {/* Description is admin-authored HTML from the Spree CMS backend (trusted source) */}
                <div
                  className={DESCRIPTION_HTML_CLASSES}
                  dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                />
              </PdpAccordion>
            )}

            {hasSpecifications && (
              <PdpAccordion title={tPdp("specifications")}>
                <div className="space-y-2.5">
                  {skuOrOptionRows}
                  <ProductCustomFields customFields={product.custom_fields} />
                </div>
              </PdpAccordion>
            )}

            <PdpAccordion title={tPdp("shippingReturns")}>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <Truck
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0"
                  />
                  {tPdp("freeShipping")}
                </li>
                <li className="flex items-start gap-3">
                  <RotateCcw
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0"
                  />
                  {tPdp("returns30")}
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0"
                  />
                  {tPdp("warranty")}
                </li>
              </ul>
            </PdpAccordion>
          </div>
        </div>
      </div>

      {/* Sticky buy bar — same handler and selected variant as the buy box */}
      <StickyBuyBar
        visible={showStickyBar}
        productName={product.name}
        amount={displayPrice}
        compareAt={strikethroughPrice}
        purchasable={isPurchasable}
        loading={loading}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
