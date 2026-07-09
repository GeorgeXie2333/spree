"use client";

import { CircleAlert, CircleCheck, Mail } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/lib/data/customer";
import { extractBasePath } from "@/lib/utils/path";

const inputClassName = "rounded-xl border-border bg-white";

export default function ForgotPasswordPage() {
  const t = useTranslations("forgotPassword");
  const pathname = usePathname();
  const basePath = extractBasePath(pathname);

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const origin = window.location.origin;
      const redirectUrl = `${origin}${basePath}/account/reset-password`;
      const result = await requestPasswordReset(email, redirectUrl);
      if (result?.message) {
        setSubmitted(true);
      } else {
        setError(t("genericError"));
      }
    } catch {
      setError(t("genericError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-[18px] bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white">
            <CircleCheck className="h-6 w-6 text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("checkYourEmail")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.rich("resetEmailSent", {
              email,
              strong: (chunks) => (
                <strong className="font-medium text-foreground">
                  {chunks}
                </strong>
              ),
            })}
          </p>

          <div className="mt-6 flex items-start gap-3 text-left text-sm text-muted-foreground">
            <Mail className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <p>{t("linkExpiry")}</p>
          </div>

          <Button
            variant="outline"
            className="mt-6 w-full"
            onClick={() => {
              setSubmitted(false);
              setEmail("");
            }}
          >
            {t("tryDifferentEmail")}
          </Button>

          <Link
            href={`${basePath}/account`}
            className="mt-6 inline-block text-sm text-link hover:underline"
          >
            {t("backToSignIn")}
          </Link>
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

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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

          <Button
            type="submit"
            disabled={submitting}
            size="lg"
            className="w-full"
          >
            {submitting ? t("sending") : t("sendResetLink")}
          </Button>
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
