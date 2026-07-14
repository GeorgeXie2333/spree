"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { siteConfig } from "@/lib/site-config";

export function ContactPage() {
  const t = useTranslations("contact");
  const supportEmail = siteConfig.supportEmail;

  return (
    <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-4 text-base text-muted-foreground">{t("intro")}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          {t("emailFallback", { email: supportEmail })}
        </p>
      </div>

      <form
        aria-label={t("title")}
        action={`mailto:${supportEmail}`}
        method="post"
        encType="text/plain"
        className="mx-auto mt-10 max-w-xl rounded-[18px] bg-card p-6 sm:p-8"
      >
        <FieldGroup className="gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="contact-name">{t("nameLabel")}</FieldLabel>
              <Input
                id="contact-name"
                name="name"
                autoComplete="name"
                className="rounded-xl border-border bg-background"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="contact-email">{t("emailLabel")}</FieldLabel>
              <Input
                id="contact-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="rounded-xl border-border bg-background"
              />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="contact-phone">{t("phoneLabel")}</FieldLabel>
              <Input
                id="contact-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                className="rounded-xl border-border bg-background"
              />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="contact-message">
                {t("messageLabel")}
              </FieldLabel>
              <Textarea
                id="contact-message"
                name="message"
                required
                rows={6}
                className="rounded-xl border-border bg-background"
              />
            </Field>
          </div>
          <Button type="submit" size="lg">
            {t("submit")}
          </Button>
        </FieldGroup>
      </form>
    </div>
  );
}
