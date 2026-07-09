import type { CustomField } from "@spree/sdk";
import { useTranslations } from "next-intl";

interface ProductCustomFieldsProps {
  customFields?: Array<CustomField>;
}

function renderBooleanValue(
  value: unknown,
  t: ReturnType<typeof useTranslations<"products">>,
): React.ReactNode {
  return value ? t("yes") : t("no");
}

function renderValue(
  field: CustomField,
  t: ReturnType<typeof useTranslations<"products">>,
): React.ReactNode {
  switch (field.field_type) {
    case "boolean":
      return renderBooleanValue(field.value, t);
    case "json":
      return typeof field.value === "string"
        ? field.value
        : JSON.stringify(field.value);
    case "rich_text":
      // Value is admin-authored HTML from the Spree CMS backend (trusted source)
      return <span dangerouslySetInnerHTML={{ __html: field.value ?? "" }} />;
    case "short_text":
    case "long_text":
    case "number":
      return String(field.value);
    default:
      return String(field.value);
  }
}

/**
 * Two-column definition list of product custom fields. Rendered inside the
 * PDP "Specifications" accordion — no heading or outer chrome of its own.
 */
export function ProductCustomFields({
  customFields,
}: ProductCustomFieldsProps): React.JSX.Element | null {
  const t = useTranslations("products");

  if (!customFields || customFields.length === 0) {
    return null;
  }

  return (
    <dl className="grid grid-cols-[minmax(7rem,11rem)_1fr] gap-x-6 gap-y-2.5">
      {customFields.map((field) => (
        <div key={field.id} className="contents">
          <dt className="text-sm text-muted-foreground">{field.label}</dt>
          <dd className="min-w-0 text-sm text-foreground">
            {renderValue(field, t)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
