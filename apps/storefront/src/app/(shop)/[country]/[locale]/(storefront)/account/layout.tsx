"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { extractBasePath } from "@/lib/utils/path";

function getNavItems(t: ReturnType<typeof useTranslations<"account">>): {
  href: string;
  label: string;
}[] {
  return [
    { href: "/account", label: t("overview") },
    { href: "/account/orders", label: t("orders") },
    { href: "/account/addresses", label: t("addresses") },
    { href: "/account/credit-cards", label: t("paymentMethods") },
    { href: "/account/profile", label: t("profile") },
  ];
}

function ContentSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-1/3 rounded-xl" />
      <Skeleton className="h-4 w-2/3 rounded-xl" />
      <Skeleton className="h-32 rounded-[18px]" />
      <Skeleton className="h-32 rounded-[18px]" />
    </div>
  );
}

interface AccountShellProps {
  children: React.ReactNode;
  basePath: string;
  pathname: string;
  user?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string;
  } | null;
  onLogout?: () => void;
  isLoading?: boolean;
}

function AccountShell({
  children,
  basePath,
  pathname,
  user,
  onLogout,
  isLoading,
}: AccountShellProps) {
  const t = useTranslations("account");
  const navItems = getNavItems(t);

  const isItemActive = (itemHref: string) => {
    const href = `${basePath}${itemHref}`;
    return (
      pathname === href ||
      (itemHref !== "/account" && pathname.startsWith(href))
    );
  };

  return (
    <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
        {/* Desktop sidebar — quiet text list */}
        <aside className="hidden w-52 flex-shrink-0 lg:block">
          <div className="sticky top-[100px] flex flex-col gap-6">
            <div>
              {isLoading ? (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-36" />
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold tracking-tight text-foreground">
                    {user?.first_name
                      ? `${user.first_name} ${user.last_name || ""}`.trim()
                      : t("myAccount")}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {user?.email}
                  </p>
                </>
              )}
            </div>

            <nav>
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const active = isItemActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={`${basePath}${item.href}`}
                        className={`block py-1.5 text-sm transition-colors duration-200 ${
                          active
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="border-t border-border pt-4">
              <button
                type="button"
                onClick={onLogout}
                disabled={isLoading}
                className="cursor-pointer text-sm text-link transition-colors duration-200 hover:underline disabled:opacity-50"
              >
                {t("signOut")}
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile: horizontal scroll tabs */}
        <div className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto border-b border-border px-4 pb-3 lg:hidden">
          {navItems.map((item) => {
            const active = isItemActive(item.href);
            return (
              <Link
                key={item.href}
                href={`${basePath}${item.href}`}
                className={`shrink-0 whitespace-nowrap pb-0.5 text-sm transition-colors duration-200 ${
                  active
                    ? "border-b-2 border-foreground font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={onLogout}
            disabled={isLoading}
            className="shrink-0 cursor-pointer whitespace-nowrap pb-0.5 text-sm text-link transition-colors duration-200 hover:underline disabled:opacity-50"
          >
            {t("signOut")}
          </button>
        </div>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const basePath = extractBasePath(pathname);
  const { user, logout, isAuthenticated, loading } = useAuth();

  const authPagePaths = new Set([
    `${basePath}/account/register`,
    `${basePath}/account/forgot-password`,
    `${basePath}/account/reset-password`,
  ]);
  const isAuthPage = authPagePaths.has(pathname);
  const isMainAccountPage = pathname === `${basePath}/account`;

  useEffect(() => {
    if (!loading && !isAuthenticated && !isAuthPage && !isMainAccountPage) {
      router.replace(`${basePath}/account`);
    }
  }, [
    loading,
    isAuthenticated,
    isAuthPage,
    isMainAccountPage,
    basePath,
    router,
  ]);

  if (loading || (!isAuthenticated && !isAuthPage && !isMainAccountPage)) {
    if (isAuthPage || isMainAccountPage) {
      return (
        <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 rounded-[18px] bg-card p-8">
            <Skeleton className="mx-auto h-8 w-1/2 rounded-xl bg-primary-foreground/60" />
            <Skeleton className="mx-auto h-4 w-3/4 rounded-xl bg-primary-foreground/60" />
            <Skeleton className="h-40 rounded-xl bg-primary-foreground/60" />
          </div>
        </div>
      );
    }
    return (
      <AccountShell basePath={basePath} pathname={pathname} isLoading={true}>
        <ContentSkeleton />
      </AccountShell>
    );
  }

  if (isAuthPage || !isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <AccountShell
      basePath={basePath}
      pathname={pathname}
      user={user}
      onLogout={logout}
    >
      {children}
    </AccountShell>
  );
}
