"use client";

import type { Media } from "@spree/sdk";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const SWIPE_THRESHOLD_PX = 50;
const SWIPE_MAX_VERTICAL_PX = 75;

interface MediaLightboxProps {
  images: Media[];
  activeIndex: number;
  productName: string;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
}

/**
 * Fullscreen image lightbox. Lazy-loaded from MediaGallery so its
 * keyboard handlers, navigation UI, and next/image full-size render
 * don't ship in the initial product page bundle.
 *
 * Rendered through the shared Dialog primitive so modal focus trapping,
 * page isolation, Escape handling, and focus restoration stay consistent.
 */
export function MediaLightbox({
  images,
  activeIndex,
  productName,
  onClose,
  onNavigate,
}: MediaLightboxProps): React.ReactElement | null {
  const t = useTranslations("products");
  const current = images[activeIndex];
  const src =
    current?.xlarge_url || current?.large_url || current?.original_url || null;
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const pressedOnBackdropRef = useRef(false);

  const goPrev = useCallback(() => {
    onNavigate(activeIndex === 0 ? images.length - 1 : activeIndex - 1);
  }, [activeIndex, images.length, onNavigate]);

  const goNext = useCallback(() => {
    onNavigate(activeIndex === images.length - 1 ? 0 : activeIndex + 1);
  }, [activeIndex, images.length, onNavigate]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
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
      pressedOnBackdropRef.current = false;
      if (dx < 0) {
        goNext();
      } else {
        goPrev();
      }
    },
    [goNext, goPrev, images.length],
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goPrev, goNext]);

  if (!src) return null;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-media-backdrop/90"
        className="h-full w-full max-w-none border-0 bg-transparent p-0 shadow-none"
        aria-modal="true"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <DialogTitle className="sr-only">{t("openImageZoom")}</DialogTitle>
        <div
          data-testid="media-lightbox-backdrop"
          className="relative flex size-full touch-pan-y items-center justify-center"
          onPointerDown={(event) => {
            pressedOnBackdropRef.current = event.target === event.currentTarget;
          }}
          onClick={(event) => {
            if (
              event.target === event.currentTarget &&
              pressedOnBackdropRef.current
            ) {
              onClose();
            }
            pressedOnBackdropRef.current = false;
          }}
        >
          <div className="relative m-4 h-[calc(100%-2rem)] max-h-[90vh] w-[calc(100%-2rem)] max-w-4xl">
            <Image
              src={src}
              alt={current?.alt || productName}
              fill
              className="pointer-events-none object-contain"
              sizes="100vw"
            />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            className="absolute top-4 right-4 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            onClick={onClose}
            aria-label={t("lightboxClose")}
          >
            <X />
          </Button>

          {images.length > 1 && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className="absolute top-1/2 left-4 -translate-y-1/2 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                onClick={goPrev}
                aria-label={t("lightboxPrev")}
              >
                <ChevronLeft />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className="absolute top-1/2 right-4 -translate-y-1/2 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                onClick={goNext}
                aria-label={t("lightboxNext")}
              >
                <ChevronRight />
              </Button>
            </>
          )}

          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-foreground/50 px-3 py-1 text-sm text-primary-foreground">
              {activeIndex + 1} / {images.length}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
