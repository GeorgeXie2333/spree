import type { Category } from "@spree/sdk";
import { CategoryCircle } from "@/components/commerce/CategoryCircle";
import { getCenwatchRootCategory } from "@/lib/data/categories";

interface HomeCategoryRailProps {
  basePath: string;
}

/**
 * Horizontally scrollable rail of root category circles. Renders nothing
 * when there are no categories or the backend is unavailable.
 */
export async function HomeCategoryRail({ basePath }: HomeCategoryRailProps) {
  const rootCategory = await getCenwatchRootCategory();
  const categories: Category[] = rootCategory
    ? rootCategory.children?.length
      ? rootCategory.children
      : [rootCategory]
    : [];

  if (categories.length === 0) return null;

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="no-scrollbar -mx-4 flex snap-x gap-6 overflow-x-auto scroll-px-4 px-4 md:gap-8">
        {categories.map((category) => (
          <CategoryCircle
            key={category.id}
            category={category}
            basePath={basePath}
          />
        ))}
      </div>
    </section>
  );
}
