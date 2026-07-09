import type { Category } from "@spree/sdk";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";

interface CategoryBannerProps {
  category: Category;
  basePath: string;
  locale: string;
}

/**
 * Apple-style category PLP header: breadcrumbs, two-tone title +
 * description, and a row of subcategory pill links when children exist.
 */
export async function CategoryBanner({
  category,
  basePath,
  locale,
}: CategoryBannerProps) {
  "use cache: remote";
  cacheLife("minutes");
  cacheTag("category-banner");

  const children = category.children ?? [];

  return (
    <div className="container mx-auto px-4 pt-8 sm:px-6 lg:px-8">
      <Breadcrumbs category={category} basePath={basePath} locale={locale} />

      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          {category.name}
          {category.description ? (
            <span className="font-semibold text-muted-foreground">
              {" "}
              {category.description}
            </span>
          ) : null}
        </h1>

        {children.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`${basePath}/c/${child.permalink}`}
                className="rounded-full bg-card px-4 py-2 text-sm text-foreground transition-colors duration-200 hover:bg-[#e8e8ed]"
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
