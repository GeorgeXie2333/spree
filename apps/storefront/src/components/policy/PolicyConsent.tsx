"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { CONSENT_POLICIES } from "@/lib/constants/policies";
import { cn } from "@/lib/utils";
import { extractBasePath } from "@/lib/utils/path";

interface PolicyConsentProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  error?: boolean;
  disabled?: boolean;
  id?: string;
}

export function PolicyConsent({
  checked,
  onCheckedChange,
  error,
  disabled = false,
  id = "policy-consent",
}: PolicyConsentProps) {
  const pathname = usePathname();
  const basePath = extractBasePath(pathname);
  const t = useTranslations("checkout");
  const tp = useTranslations("policies");

  return (
    <Field
      className="items-start"
      orientation="horizontal"
      data-invalid={error}
      data-disabled={disabled}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        disabled={disabled}
        aria-invalid={error}
        className="mt-0.5"
      />
      <FieldLabel htmlFor={id} className="text-sm">
        {t("iAgreeToThe")}{" "}
        {CONSENT_POLICIES.map((policy, index) => (
          <span key={policy.slug}>
            {index > 0 &&
              index < CONSENT_POLICIES.length - 1 &&
              t("policySeparatorComma")}
            {index > 0 &&
              index === CONSENT_POLICIES.length - 1 &&
              t("policySeparatorAnd")}
            <Link
              href={`${basePath}/policies/${policy.slug}`}
              target="_blank"
              className={cn(
                "underline",
                error
                  ? "text-destructive hover:text-destructive/70"
                  : "text-primary hover:text-primary/70",
              )}
            >
              {tp(policy.nameKey)}
            </Link>
          </span>
        ))}
      </FieldLabel>
    </Field>
  );
}
