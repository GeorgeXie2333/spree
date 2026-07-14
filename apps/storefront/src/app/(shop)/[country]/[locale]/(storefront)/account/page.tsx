"use client";

import {
  CircleAlert,
  CreditCard,
  Eye,
  EyeOff,
  MapPin,
  ShoppingBag,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { extractBasePath, getSafeRedirectPath } from "@/lib/utils/path";

const inputClassName = "rounded-xl border-border bg-background";

interface OverviewTile {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function AccountPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const basePath = extractBasePath(pathname);
  const t = useTranslations("account");
  const { user, login, isAuthenticated, loading: authLoading } = useAuth();

  const redirectUrl = searchParams.get("redirect");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await login(email, password);
    if (result.success) {
      const safeRedirectPath = getSafeRedirectPath(redirectUrl, basePath);
      if (safeRedirectPath) {
        router.push(safeRedirectPath);
      }
    } else {
      setError(result.error || t("invalidCredentials"));
    }
    setLoading(false);
  };

  if (authLoading) {
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

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[18px] bg-card p-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {t("signInTitle")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("signInDescription")}
          </p>

          <form onSubmit={handleSubmit} className="mt-8">
            <FieldGroup className="gap-4">
              {error && (
                <Alert variant="destructive">
                  <CircleAlert />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Field>
                <FieldLabel htmlFor="email">{t("email")}</FieldLabel>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className={inputClassName}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">{t("password")}</FieldLabel>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="current-password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className={`${inputClassName} pr-10`}
                  />
                  <div className="absolute top-1/2 right-1 -translate-y-1/2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? t("hidePassword") : t("showPassword")
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </Field>

              <div className="flex justify-end">
                <Link
                  href={`${basePath}/account/forgot-password`}
                  className="text-sm text-link hover:underline"
                >
                  {t("forgotPassword")}
                </Link>
              </div>

              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="w-full"
              >
                {loading ? t("signingIn") : t("signIn")}
              </Button>
            </FieldGroup>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            {t("dontHaveAccount")}{" "}
            <Link
              href={`${basePath}/account/register`}
              className="text-link hover:underline"
            >
              {t("signUp")}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const tiles: OverviewTile[] = [
    {
      href: `${basePath}/account/orders`,
      icon: <ShoppingBag className="h-6 w-6 stroke-[1.5]" />,
      title: t("orderHistory"),
      description: t("orderHistoryDescription"),
    },
    {
      href: `${basePath}/account/addresses`,
      icon: <MapPin className="h-6 w-6 stroke-[1.5]" />,
      title: t("addresses"),
      description: t("addressesDescription"),
    },
    {
      href: `${basePath}/account/credit-cards`,
      icon: <CreditCard className="h-6 w-6 stroke-[1.5]" />,
      title: t("paymentMethods"),
      description: t("paymentMethodsDescription"),
    },
    {
      href: `${basePath}/account/profile`,
      icon: <User className="h-6 w-6 stroke-[1.5]" />,
      title: t("profile"),
      description: t("profileDescription"),
    },
  ];

  return (
    <div>
      <h1 className="mb-8 text-3xl font-semibold tracking-tight text-foreground">
        {user?.first_name
          ? t("greeting", { name: user.first_name })
          : t("accountOverview")}
      </h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {tiles.map((tile) => (
          <Link
            key={tile.href}
            href={tile.href}
            className="group rounded-[18px] bg-card p-6 transition-colors duration-200 hover:bg-card-hover"
          >
            <div className="text-foreground">{tile.icon}</div>
            <h2 className="mt-4 font-semibold tracking-tight text-foreground">
              {tile.title}
              <span className="text-link opacity-0 transition-opacity group-hover:opacity-100">
                {" "}
                ›
              </span>
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {tile.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
