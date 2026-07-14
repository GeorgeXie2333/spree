"use client";

import type { Category } from "@spree/sdk";
import { ArrowLeft, Check, ChevronRight, User, X } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetTitle,
} from "@/components/ui/sheet";
import { useStore } from "@/contexts/StoreContext";
import { useCountrySwitch } from "@/hooks/useCountrySwitch";
import { useLocaleSwitch } from "@/hooks/useLocaleSwitch";
import { getLanguageOption, languageOptions } from "@/lib/i18n/languages";
import { CountryFlagIcon } from "./CountryFlagIcon";

type PanelType =
  | { kind: "main" }
  | { kind: "category"; category: Category }
  | { kind: "country" }
  | { kind: "language" };

interface MobileMenuProps {
  rootCategories: Category[];
  basePath: string;
}

function localizedHref(basePath: string, href: string): string {
  if (/^https?:\/\//.test(href)) return href;
  if (href === "/") return basePath || "/";
  if (href.startsWith("#")) return `${basePath || "/"}${href}`;
  return `${basePath}${href.startsWith("/") ? href : `/${href}`}`;
}

export function MobileMenu({ rootCategories, basePath }: MobileMenuProps) {
  const t = useTranslations("header");
  const tc = useTranslations("common");
  const tf = useTranslations("footer");
  const [open, setOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [panelStack, setPanelStack] = useState<PanelType[]>([{ kind: "main" }]);
  // animatedIndex trails panelStack — new panels mount off-screen, then animate in
  const [animatedIndex, setAnimatedIndex] = useState(0);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { country, locale, currency, countries } = useStore();
  const { isCountryNavigating, handleCountrySelect } = useCountrySwitch({
    currentCountry: country,
    currentLocale: locale,
    onBeforeNavigate: () => setOpen(false),
  });
  const { isLocaleNavigating, handleLocaleSelect } = useLocaleSwitch({
    currentCountry: country,
    currentLocale: locale,
    currency,
    onBeforeNavigate: () => setOpen(false),
  });
  const currentLanguage = getLanguageOption(locale);

  const currentPanel = panelStack[panelStack.length - 1];

  const cancelPendingCallbacks = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const pushPanel = (panel: PanelType) => {
    cancelPendingCallbacks();
    // Step 1: mount the new panel off-screen (translate-x-full) via flushSync
    flushSync(() => {
      setPanelStack((prev) => [...prev, panel]);
    });
    // Step 2: on next frame, update animatedIndex to trigger slide-in
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setAnimatedIndex((prev) => prev + 1);
    });
  };

  const popPanel = () => {
    cancelPendingCallbacks();
    // Step 1: animate out by decrementing animatedIndex
    setAnimatedIndex((prev) => Math.max(0, prev - 1));
    // Step 2: after transition, remove the panel from the stack
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      setPanelStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
    }, 300);
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      cancelPendingCallbacks();
      setPanelStack([{ kind: "main" }]);
      setAnimatedIndex(0);
    }
  };

  // Shared link style
  const linkClass =
    "rounded-lg px-3 py-2.5 text-left text-base text-foreground transition-colors hover:bg-muted";

  // Shared button style for items with children (chevron)
  const categoryButtonClass =
    "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-base text-foreground transition-colors hover:bg-muted";

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {/* Animated hamburger / X button — two-phase animation matching Lottie reference */}
      <Button
        variant="ghost"
        size="icon-lg"
        onClick={() => {
          if (!hasInteracted) setHasInteracted(true);
          setOpen(!open);
        }}
        aria-label={open ? t("closeMenu") : t("openMenu")}
        className="relative z-[60] cursor-pointer"
      >
        <div className="relative size-5">
          {/* Top line: phase 1 translates to center, phase 2 rotates 45° */}
          <span
            className={`absolute left-0 right-0 h-0.5 bg-current rounded-full top-[2px] ${
              hasInteracted
                ? open
                  ? "animate-hamburger-top-open"
                  : "animate-hamburger-top-close"
                : ""
            }`}
          />
          {/* Middle line: fades out in phase 1, fades in after delay on close */}
          <span
            className={`absolute left-0 right-0 h-0.5 bg-current rounded-full top-1/2 -translate-y-1/2 ${
              hasInteracted
                ? open
                  ? "animate-hamburger-mid-open"
                  : "animate-hamburger-mid-close"
                : ""
            }`}
            style={
              hasInteracted && !open
                ? { animationDelay: "0.2s", opacity: 0 }
                : undefined
            }
          />
          {/* Bottom line: phase 1 translates to center, phase 2 rotates -45° */}
          <span
            className={`absolute left-0 right-0 h-0.5 bg-current rounded-full bottom-[2px] ${
              hasInteracted
                ? open
                  ? "animate-hamburger-bottom-open"
                  : "animate-hamburger-bottom-close"
                : ""
            }`}
          />
        </div>
      </Button>

      <SheetContent
        side="left"
        className="flex flex-col !gap-0 !rounded-none overflow-hidden max-md:!top-[84px] max-md:!h-[calc(100%-84px)] max-md:!w-full max-md:!max-w-none max-md:!border-r-0"
        showCloseButton={false}
        overlayClassName="max-md:!top-[84px] max-md:!bg-transparent"
      >
        <SheetTitle className="sr-only">{t("menu")}</SheetTitle>
        {/* Menu header — changes based on active panel */}
        <div className="relative hidden h-16 items-center justify-between overflow-hidden border-b border-border px-4 md:flex">
          {/* "Menu" title — visible when on main panel */}
          <span
            className={`text-base font-semibold transition-all duration-300 ease-in-out absolute left-4 ${
              currentPanel.kind === "main"
                ? "translate-x-0 opacity-100"
                : "-translate-x-8 opacity-0 pointer-events-none"
            }`}
          >
            {t("menu")}
          </span>
          {/* Back button + category name — visible on sub-panels */}
          <button
            type="button"
            onClick={popPanel}
            className={`absolute left-4 flex cursor-pointer items-center gap-2 text-base font-semibold text-foreground transition-all duration-300 ease-in-out ${
              currentPanel.kind !== "main"
                ? "translate-x-0 opacity-100"
                : "translate-x-8 opacity-0 pointer-events-none"
            }`}
          >
            <ArrowLeft className="size-5" />
            <span>
              {currentPanel.kind === "category"
                ? currentPanel.category.name
                : currentPanel.kind === "country"
                  ? t("selectCountry")
                  : currentPanel.kind === "language"
                    ? tc("selectLanguage")
                    : ""}
            </span>
          </button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setOpen(false)}
            className="cursor-pointer ml-auto"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Sliding panels container */}
        <div className="relative flex-1 overflow-hidden">
          {/* Main menu panel */}
          <div
            className={`absolute inset-0 flex flex-col bg-background transition-transform duration-300 ease-in-out ${
              animatedIndex === 0 && currentPanel.kind === "main"
                ? "translate-x-0"
                : "-translate-x-full"
            }`}
          >
            <nav className="flex flex-col gap-1 px-4 flex-1 overflow-y-auto pt-2">
              {[
                { label: t("home"), href: "/" },
                { label: t("allProducts"), href: "/products" },
                { label: tf("userGuide"), href: "/operation-instructions" },
                { label: tf("contact"), href: "/contact" },
                { label: tf("orderTracking"), href: "/order-tracking" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={localizedHref(basePath, item.href)}
                  onClick={() => setOpen(false)}
                  className={linkClass}
                >
                  {item.label}
                </Link>
              ))}
              {rootCategories.length > 0 && (
                <div className="mt-3 border-t border-border pt-3">
                  <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("categories")}
                  </p>
                  <div className="flex flex-col gap-1">
                    {rootCategories.map((category) =>
                      category.children && category.children.length > 0 ? (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() =>
                            pushPanel({ kind: "category", category })
                          }
                          className={categoryButtonClass}
                        >
                          <span>{category.name}</span>
                          <ChevronRight className="size-4 text-muted-foreground" />
                        </button>
                      ) : (
                        <Link
                          key={category.id}
                          href={`${basePath}/c/${category.permalink}`}
                          onClick={() => setOpen(false)}
                          className={linkClass}
                        >
                          {category.name}
                        </Link>
                      ),
                    )}
                  </div>
                </div>
              )}
            </nav>

            {/* Footer: Country/language switchers + Account */}
            <SheetFooter className="gap-2 border-t border-border pt-4 lg:hidden">
              <button
                type="button"
                onClick={() => pushPanel({ kind: "country" })}
                className="flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-base text-foreground transition-colors hover:bg-muted"
              >
                <CountryFlagIcon countryCode={country} />
                <span className="font-medium">{country.toUpperCase()}</span>
                <span className="text-muted-foreground">|</span>
                <span>{currency}</span>
                <ChevronRight className="ml-auto size-4 text-muted-foreground" />
              </button>
              <button
                type="button"
                onClick={() => pushPanel({ kind: "language" })}
                className="flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-base text-foreground transition-colors hover:bg-muted"
              >
                <span className="font-medium">{currentLanguage.label}</span>
                <span className="text-muted-foreground">|</span>
                <span>{currentLanguage.shortLabel}</span>
                <ChevronRight className="ml-auto size-4 text-muted-foreground" />
              </button>

              <SheetClose asChild className="md:hidden">
                <Link
                  href={`${basePath}/account`}
                  className="mx-4 mb-2 flex items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-foreground/90"
                >
                  <User className="size-5" />
                  <span>{t("myAccount")}</span>
                </Link>
              </SheetClose>
            </SheetFooter>
          </div>

          {/* Category sub-panels — one for each level in the stack */}
          {panelStack.map((panel, index) => {
            if (panel.kind !== "category") return null;
            const isAnimatedIn = index <= animatedIndex;
            let translateClass = "translate-x-full";
            if (isAnimatedIn && index < panelStack.length - 1)
              translateClass = "-translate-x-full";
            else if (isAnimatedIn) translateClass = "translate-x-0";

            return (
              <div
                key={`cat-${panel.category.id}-${index}`}
                className={`absolute inset-0 flex flex-col bg-background transition-transform duration-300 ease-in-out ${translateClass}`}
              >
                {/* Back button (mobile only — desktop uses the global header) */}
                <div className="border-b border-border px-4 py-2 md:hidden">
                  <button
                    type="button"
                    onClick={popPanel}
                    className="flex items-center gap-2 py-2 text-base font-medium text-foreground"
                  >
                    <ArrowLeft className="size-5" />
                    <span>{panel.category.name}</span>
                  </button>
                </div>

                {/* Children */}
                <nav className="flex flex-col gap-1 px-4 flex-1 overflow-y-auto pt-2">
                  {panel.category.children?.map((child) =>
                    child.children && child.children.length > 0 ? (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() =>
                          pushPanel({ kind: "category", category: child })
                        }
                        className={categoryButtonClass}
                      >
                        <span>{child.name}</span>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </button>
                    ) : (
                      <Link
                        key={child.id}
                        href={`${basePath}/c/${child.permalink}`}
                        onClick={() => handleOpenChange(false)}
                        className={linkClass}
                      >
                        {child.name}
                      </Link>
                    ),
                  )}
                </nav>

                {/* "View all" at the bottom */}
                <div className="border-t border-border px-4 py-3">
                  <Link
                    href={`${basePath}/c/${panel.category.permalink}`}
                    onClick={() => handleOpenChange(false)}
                    className="block w-full py-2 text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("viewAllCategory", { category: panel.category.name })}
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Country selector panel */}
          <div
            className={`absolute inset-0 flex flex-col bg-background transition-transform duration-300 ease-in-out ${
              currentPanel.kind === "country" &&
              animatedIndex === panelStack.length - 1
                ? "translate-x-0"
                : "translate-x-full"
            }`}
          >
            <div className="border-b border-border px-4 py-2 md:hidden">
              <button
                type="button"
                onClick={popPanel}
                className="flex items-center gap-2 py-2 text-base font-medium text-foreground"
              >
                <ArrowLeft className="size-5" />
                <span>{t("selectCountry")}</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2">
              {countries.map((c) => {
                const isSelected =
                  c.iso.toLowerCase() === country.toLowerCase();
                return (
                  <button
                    key={c.iso}
                    type="button"
                    disabled={isCountryNavigating}
                    onClick={() => handleCountrySelect(c)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base transition-colors ${
                      isSelected ? "bg-muted font-medium" : "hover:bg-muted"
                    }`}
                  >
                    <CountryFlagIcon countryCode={c.iso} />
                    <span className="flex-1 text-left font-medium">
                      {c.name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {c.currency}
                    </span>
                    {isSelected && <Check className="size-4 text-foreground" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language selector panel */}
          <div
            className={`absolute inset-0 flex flex-col bg-background transition-transform duration-300 ease-in-out ${
              currentPanel.kind === "language" &&
              animatedIndex === panelStack.length - 1
                ? "translate-x-0"
                : "translate-x-full"
            }`}
          >
            <div className="border-b border-border px-4 py-2 md:hidden">
              <button
                type="button"
                onClick={popPanel}
                className="flex items-center gap-2 py-2 text-base font-medium text-foreground"
              >
                <ArrowLeft className="size-5" />
                <span>{tc("selectLanguage")}</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2">
              {languageOptions.map((option) => {
                const isSelected = option.locale === locale;
                return (
                  <button
                    key={option.locale}
                    type="button"
                    disabled={isLocaleNavigating}
                    onClick={() => handleLocaleSelect(option.locale)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base transition-colors ${
                      isSelected ? "bg-muted font-medium" : "hover:bg-muted"
                    }`}
                  >
                    <span className="flex-1 text-left font-medium">
                      {option.label}
                    </span>
                    <span className="text-sm uppercase text-muted-foreground">
                      {option.locale}
                    </span>
                    {isSelected && <Check className="size-4 text-foreground" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
