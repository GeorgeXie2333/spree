import { cn } from "@/lib/utils";

const FLAG_ICON_BASE_URL =
  "https://cdn.jsdelivr.net/gh/lipis/flag-icons/flags/4x3";

export function flagIconUrl(countryCode: string): string {
  return `${FLAG_ICON_BASE_URL}/${countryCode.toLowerCase()}.svg`;
}

interface CountryFlagIconProps {
  countryCode: string;
  className?: string;
}

export function CountryFlagIcon({
  countryCode,
  className,
}: CountryFlagIconProps) {
  const normalized = countryCode.toLowerCase();
  if (!/^[a-z]{2}$/.test(normalized)) return null;

  return (
    // biome-ignore lint/performance/noImgElement: flag icons are tiny CDN SVGs and should not require Next image optimization config.
    <img
      src={flagIconUrl(normalized)}
      alt={`${normalized.toUpperCase()} flag`}
      width={20}
      height={15}
      loading="lazy"
      decoding="async"
      className={cn("h-3.5 w-5 rounded-[1px] object-cover", className)}
    />
  );
}
