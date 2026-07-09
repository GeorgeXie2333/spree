"use client";

import { ArrowLeft, ChevronDown, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  CheckoutProvider,
  CheckoutSummary,
  useCheckout,
} from "@/contexts/CheckoutContext";
import { POLICY_LINKS } from "@/lib/constants/policies";
import { getStoreName } from "@/lib/store";
import { extractBasePath } from "@/lib/utils/path";

const storeName = getStoreName();

function CheckoutHeader() {
  const pathname = usePathname();
  const basePath = extractBasePath(pathname);
  const t = useTranslations("checkoutLayout");

  return (
    <header className="flex items-center justify-between h-16">
      <Link
        href={basePath || "/"}
        className="text-[17px] font-semibold tracking-tight text-foreground"
      >
        {storeName}
      </Link>
      <Link
        href={basePath || "/"}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 flex items-center gap-1"
        aria-label={t("backToStore")}
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        {t("backToStore")}
      </Link>
    </header>
  );
}

function CheckoutFooter() {
  const pathname = usePathname();
  const basePath = extractBasePath(pathname);
  const t = useTranslations("checkoutLayout");
  const tp = useTranslations("policies");

  return (
    <footer className="py-4 text-xs text-muted-foreground border-t border-border mt-auto flex flex-wrap items-center gap-x-3 gap-y-1">
      <p>
        {t("allRightsReserved", { year: new Date().getFullYear(), storeName })}
      </p>
      {POLICY_LINKS.map((policy) => (
        <Link
          key={policy.slug}
          href={`${basePath}/policies/${policy.slug}`}
          target="_blank"
          className="text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors duration-200"
        >
          {tp(policy.nameKey)}
        </Link>
      ))}
    </footer>
  );
}

function MobileSummaryToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("checkoutLayout");
  const { summaryContent } = useCheckout();

  // Hide the toggle entirely when there's no summary to show (e.g. the
  // order-placed page clears summaryContent because the page already
  // displays the order details inline).
  if (summaryContent === null) return null;

  return (
    <div className="lg:hidden border-b border-border bg-card">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left"
        aria-expanded={isOpen}
        aria-controls="checkout-summary-panel"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <ShoppingBag className="w-5 h-5 text-muted-foreground" />
          {isOpen ? t("hideOrderSummary") : t("showOrderSummary")}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div id="checkout-summary-panel" className="px-5 pb-4">
          <CheckoutSummary />
        </div>
      )}
    </div>
  );
}

function DesktopSummary() {
  const { summaryContent } = useCheckout();

  // Hide the card entirely when there's no summary (e.g. order-placed page).
  if (summaryContent === null) return null;

  return (
    <div className="rounded-[18px] bg-card p-6">
      <CheckoutSummary />
    </div>
  );
}

interface CheckoutLayoutProps {
  children: React.ReactNode;
}

function CheckoutLayoutContent({ children }: CheckoutLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Mobile header */}
      <div className="lg:hidden border-b border-border">
        <div className="px-5">
          <CheckoutHeader />
        </div>
      </div>

      {/* Mobile summary toggle */}
      <MobileSummaryToggle />

      {/* Main checkout grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_minmax(0,640px)_minmax(0,440px)_1fr]">
        {/* Main content area — white bg */}
        <div className="lg:col-start-2 flex flex-col">
          <div className="flex-1 px-5 py-6 lg:pl-10 lg:pr-12 lg:py-10">
            {/* Desktop header */}
            <div className="hidden lg:block mb-8">
              <CheckoutHeader />
            </div>
            {children}
          </div>
          <div className="px-5 lg:pl-10 lg:pr-12 pb-4">
            <CheckoutFooter />
          </div>
        </div>

        {/* Desktop summary sidebar — floating gray card, Apple Store style */}
        <div className="hidden lg:block lg:col-start-3">
          <div className="sticky top-0 py-10 pr-10 pl-2">
            <DesktopSummary />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutLayout({ children }: CheckoutLayoutProps) {
  return (
    <CheckoutProvider>
      <CheckoutLayoutContent>{children}</CheckoutLayoutContent>
    </CheckoutProvider>
  );
}
