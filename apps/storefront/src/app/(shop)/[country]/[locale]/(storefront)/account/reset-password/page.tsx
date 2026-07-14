"use client";

import { CircleAlert, CircleCheck, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/lib/data/customer";
import { extractBasePath } from "@/lib/utils/path";

const inputClassName = "rounded-xl border-border bg-background";

export default function ResetPasswordPage() {
  const t = useTranslations("resetPassword");
  const ta = useTranslations("account");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const basePath = extractBasePath(pathname);
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPasswordConfirmation, setShowPasswordConfirmation] =
    useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[18px] bg-card p-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("invalidLink")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("invalidLinkDescription")}
          </p>
          <Link
            href={`${basePath}/account/forgot-password`}
            className="mt-6 inline-block text-sm text-link hover:underline"
          >
            {t("requestNewLink")}
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirmation) {
      setError(t("passwordsDontMatch"));
      return;
    }

    if (password.length < 6) {
      setError(t("passwordTooShort"));
      return;
    }

    setSubmitting(true);

    try {
      const result = await resetPassword(token, password, passwordConfirmation);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || t("linkExpired"));
      }
    } catch {
      setError(t("genericError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[18px] bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-background">
            <CircleCheck className="h-6 w-6 text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("success")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("successDescription")}
          </p>
          <Button
            size="lg"
            className="mt-6 w-full"
            onClick={() => router.push(`${basePath}/account`)}
          >
            {t("signIn")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-[18px] bg-card p-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8">
          <FieldGroup className="gap-4">
            {error && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Field>
              <FieldLabel htmlFor="password">{t("newPassword")}</FieldLabel>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
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
                      showPassword ? ta("hidePassword") : ta("showPassword")
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

            <Field>
              <FieldLabel htmlFor="passwordConfirmation">
                {t("confirmPassword")}
              </FieldLabel>
              <div className="relative">
                <Input
                  type={showPasswordConfirmation ? "text" : "password"}
                  id="passwordConfirmation"
                  autoComplete="new-password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className={`${inputClassName} pr-10`}
                />
                <div className="absolute top-1/2 right-1 -translate-y-1/2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      setShowPasswordConfirmation(!showPasswordConfirmation)
                    }
                    aria-label={
                      showPasswordConfirmation
                        ? ta("hidePassword")
                        : ta("showPassword")
                    }
                  >
                    {showPasswordConfirmation ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </Field>

            <Button
              type="submit"
              disabled={submitting}
              size="lg"
              className="w-full"
            >
              {submitting ? t("resetting") : t("resetPassword")}
            </Button>
          </FieldGroup>
        </form>

        <p className="mt-8 text-center">
          <Link
            href={`${basePath}/account`}
            className="text-sm text-link hover:underline"
          >
            {t("backToSignIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
