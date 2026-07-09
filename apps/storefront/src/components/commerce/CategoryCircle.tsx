import type { Category } from "@spree/sdk";
import Link from "next/link";
import { CategoryImage } from "@/components/ui/category-image";

interface CategoryCircleProps {
  category: Category;
  basePath: string;
}

/** Apple Store-style circular category tile with the name below. */
export function CategoryCircle({ category, basePath }: CategoryCircleProps) {
  const imageUrl = category.square_image_url || category.image_url || null;

  return (
    <Link
      href={`${basePath}/c/${category.permalink}`}
      className="group flex w-24 shrink-0 snap-start flex-col items-center gap-3 md:w-28"
    >
      <div className="relative size-24 overflow-hidden rounded-full bg-card transition-transform duration-200 group-hover:scale-[1.04] md:size-28">
        <CategoryImage
          src={imageUrl}
          alt={category.name}
          fill
          className="object-cover"
          sizes="112px"
        />
      </div>
      <span className="text-center text-sm font-medium text-foreground group-hover:text-link">
        {category.name}
      </span>
    </Link>
  );
}
