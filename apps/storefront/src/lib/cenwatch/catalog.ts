import type {
  Category,
  Product,
  ProductFiltersParams,
  ProductListParams,
} from "@spree/sdk";

export const CENWATCH_CATEGORY_PERMALINK = "cenwatch";

export function isCenwatchCategory(category: Category): boolean {
  return (
    category.permalink === CENWATCH_CATEGORY_PERMALINK ||
    category.permalink.startsWith(`${CENWATCH_CATEGORY_PERMALINK}/`)
  );
}

export function isCenwatchProduct(product: Product): boolean {
  return product.categories?.some(isCenwatchCategory) ?? false;
}

export function scopeCenwatchProductParams(
  params: ProductListParams | undefined,
  categoryId: string,
): ProductListParams {
  const { in_categories: _ignored, ...scopedParams } = params ?? {};
  return { ...scopedParams, in_category: categoryId };
}

export function scopeCenwatchFilterParams(
  params: ProductFiltersParams | undefined,
  categoryId: string,
): ProductFiltersParams {
  return { ...params, category_id: categoryId };
}
