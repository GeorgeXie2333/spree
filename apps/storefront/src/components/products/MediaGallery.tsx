"use client";

import type { Media } from "@spree/sdk";
import { Play, ZoomIn } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef, useState } from "react";
import { ProductImage } from "@/components/ui/product-image";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD_PX = 50;
const SWIPE_MAX_VERTICAL_PX = 75;

/** Tiny 10×10 neutral gray PNG used as a blur placeholder while images load. */
const BLUR_PLACEHOLDER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIElEQVQYV2P4////MwwMDAxMDAwMDGQJMJCvkGwNZCsEAGebBwVss9lRAAAAAElFTkSuQmCC";

/** Lazy-loaded lightbox — only pulled into the bundle when a user zooms. */
const LazyMediaLightbox = dynamic(
  () =>
    import("@/components/products/MediaLightbox").then((mod) => ({
      default: mod.MediaLightbox,
    })),
  {
    ssr: false,
    // Minimal fullscreen overlay so the zoom click gives immediate
    // feedback on slow networks while the chunk downloads.
    loading: () => (
      <div
        className="fixed inset-0 z-50 bg-media-backdrop/90"
        aria-hidden="true"
      />
    ),
  },
);

interface MediaGalleryProps {
  images: Media[];
  productName: string;
  activeIndex?: number | null;
}

/** Prefer pre-sized Spree media URLs over the full-resolution original,
 * so the Next.js image optimizer doesn't have to fetch the source file. */
function getMainImageUrl(media: Media | undefined): string | null {
  if (!media) return null;
  return media.xlarge_url || media.large_url || media.original_url || null;
}

function getThumbImageUrl(media: Media | undefined): string | null {
  if (!media) return null;
  return media.small_url || media.mini_url || media.original_url || null;
}

function isVideoMedia(media: Media | undefined): boolean {
  if (!media) return false;
  return media.media_type === "video" || !!media.external_video_url;
}

/** Map a YouTube/Vimeo page URL to its embeddable player URL, or null for
 * direct video files that should render in a native <video> element. */
function getVideoEmbedUrl(url: string): string | null {
  const youtube = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/,
  );
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

function VideoTile({ media, title }: { media: Media; title: string }) {
  const externalUrl = media.external_video_url;
  const embedUrl = externalUrl ? getVideoEmbedUrl(externalUrl) : null;
  const fileUrl = embedUrl ? null : externalUrl || media.original_url;

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-[18px] bg-media-backdrop">
      {embedUrl ? (
        <iframe
          src={embedUrl}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : fileUrl ? (
        // biome-ignore lint/a11y/useMediaCaption: admin-managed product media has no caption tracks
        <video
          src={fileUrl}
          controls
          playsInline
          className="absolute inset-0 h-full w-full object-contain"
        />
      ) : null}
    </div>
  );
}

export function MediaGallery(props: MediaGalleryProps) {
  // Reset internal state when the parent changes activeIndex by rekeying.
  // Avoids the useEffect-to-sync-prop antipattern.
  return <MediaGalleryInner key={props.activeIndex ?? "default"} {...props} />;
}

function MediaGalleryInner({
  images,
  productName,
  activeIndex,
}: MediaGalleryProps) {
  const t = useTranslations("products");
  const tPdp = useTranslations("pdp");
  const [selectedIndex, setSelectedIndex] = useState(activeIndex ?? 0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mainImageErrorUrl, setMainImageErrorUrl] = useState<string | null>(
    null,
  );

  const safeIndex = Math.max(0, Math.min(selectedIndex, images.length - 1));

  // Indices of image-only media — the lightbox can't render videos, so it
  // navigates within this subset and maps back to full gallery indices.
  const imageIndices = useMemo(
    () =>
      images
        .map((media, index) => ({ media, index }))
        .filter(({ media }) => !isVideoMedia(media))
        .map(({ index }) => index),
    [images],
  );

  // Horizontal swipe on the main image navigates between media. When a
  // swipe is detected we suppress the synthetic click so the lightbox
  // doesn't open from the same gesture.
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    suppressClickRef.current = false;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start || images.length <= 1) return;
      const touch = e.changedTouches[0];
      if (!touch) return;
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (
        Math.abs(dx) < SWIPE_THRESHOLD_PX ||
        Math.abs(dy) > SWIPE_MAX_VERTICAL_PX
      ) {
        return;
      }
      suppressClickRef.current = true;
      const nextIndex =
        dx < 0
          ? (safeIndex + 1) % images.length
          : (safeIndex - 1 + images.length) % images.length;
      setSelectedIndex(nextIndex);
      setMainImageErrorUrl(null);
    },
    [images.length, safeIndex],
  );

  if (images.length === 0) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-[18px] bg-card">
        <ProductImage
          src={null}
          alt={productName}
          fill
          iconClassName="w-24 h-24"
        />
      </div>
    );
  }

  const selectImage = (index: number) => {
    setSelectedIndex(index);
    setMainImageErrorUrl(null);
  };

  const selectedMedia = images[safeIndex];
  const selectedIsVideo = isVideoMedia(selectedMedia);
  const mainImageUrl = getMainImageUrl(selectedMedia);
  const showMainImage = mainImageUrl && mainImageErrorUrl !== mainImageUrl;
  const lightboxIndex = Math.max(0, imageIndices.indexOf(safeIndex));

  const renderThumb = (media: Media, index: number) => {
    const isVideo = isVideoMedia(media);
    const thumbUrl = getThumbImageUrl(media);
    return (
      <button
        type="button"
        key={media.id}
        onClick={() => selectImage(index)}
        aria-label={
          isVideo ? tPdp("playVideo") : tPdp("goToMedia", { index: index + 1 })
        }
        aria-current={index === safeIndex}
        className={cn(
          "relative size-16 shrink-0 overflow-hidden rounded-xl bg-card transition-shadow duration-200",
          index === safeIndex
            ? "ring-2 ring-primary ring-offset-2"
            : "hover:ring-1 hover:ring-border",
        )}
      >
        {isVideo ? (
          <>
            {thumbUrl && (
              <ProductImage
                src={thumbUrl}
                alt={media.alt || productName}
                fill
                className="object-cover"
                sizes="64px"
              />
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-media-backdrop/40">
              <Play className="size-5 fill-media-foreground text-media-foreground" />
            </span>
          </>
        ) : (
          <ProductImage
            src={thumbUrl}
            alt={
              media.alt || t("mediaImage", { productName, index: index + 1 })
            }
            fill
            className="object-cover"
            sizes="64px"
          />
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-4">
      {/* Desktop vertical thumbnail strip */}
      {images.length > 1 && (
        <div className="no-scrollbar hidden max-h-[min(100%,36rem)] shrink-0 flex-col gap-3 overflow-y-auto lg:flex">
          {images.map((media, index) => renderThumb(media, index))}
        </div>
      )}

      <div className="min-w-0 flex-1">
        {/* Main media tile */}
        {selectedIsVideo ? (
          <VideoTile media={selectedMedia} title={productName} />
        ) : (
          <button
            type="button"
            className="relative aspect-square w-full cursor-zoom-in touch-pan-y overflow-hidden rounded-[18px] bg-card"
            onClick={() => {
              if (suppressClickRef.current) {
                suppressClickRef.current = false;
                return;
              }
              if (showMainImage) setIsZoomed(true);
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            aria-label={t("openImageZoom")}
            disabled={!showMainImage}
          >
            <ProductImage
              key={safeIndex}
              src={mainImageUrl}
              alt={selectedMedia?.alt || productName}
              fill
              className="object-cover"
              fetchPriority="high"
              loading="eager"
              priority
              quality={85}
              sizes="(max-width: 768px) 100vw, 50vw"
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
              iconClassName="w-24 h-24"
              onError={() => mainImageUrl && setMainImageErrorUrl(mainImageUrl)}
            />
            {showMainImage && (
              <div className="absolute right-4 bottom-4 flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
                <ZoomIn className="size-3.5" />
                {t("clickToZoom")}
              </div>
            )}
          </button>
        )}

        {/* Mobile horizontal snap-scroll thumbnails */}
        {images.length > 1 && (
          <div className="no-scrollbar mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-1 pb-1 lg:hidden">
            {images.map((media, index) => (
              <div key={media.id} className="snap-start">
                {renderThumb(media, index)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox (lazy) — images only, videos play inline */}
      {isZoomed && showMainImage && !selectedIsVideo && (
        <LazyMediaLightbox
          images={imageIndices.map((i) => images[i])}
          activeIndex={lightboxIndex}
          productName={productName}
          onClose={() => setIsZoomed(false)}
          onNavigate={(nextIndex) => selectImage(imageIndices[nextIndex])}
        />
      )}
    </div>
  );
}
