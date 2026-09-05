'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaMosaicProps {
  mediaUrls?: string[];
  className?: string;
}

export function MediaMosaic({ mediaUrls, className }: MediaMosaicProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const images = (mediaUrls || []).filter(Boolean);
  const count = images.length;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (lightboxIdx === null) return;
    if (e.key === 'Escape') setLightboxIdx(null);
    if (e.key === 'ArrowLeft') {
      setLightboxIdx((prev) => (prev !== null && prev > 0 ? prev - 1 : images.length - 1));
    }
    if (e.key === 'ArrowRight') {
      setLightboxIdx((prev) => (prev !== null && prev < images.length - 1 ? prev + 1 : 0));
    }
  }, [lightboxIdx, images.length]);

  useEffect(() => {
    if (lightboxIdx !== null) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxIdx, handleKeyDown]);

  if (count === 0) return null;

  return (
    <>
      <div className={cn('mt-3.5 select-none overflow-hidden', className)}>
        {/* 1 Image Layout */}
        {count === 1 && (
          <div
            onClick={() => setLightboxIdx(0)}
            className="group relative max-h-[500px] w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-md cursor-pointer"
          >
            <img
              src={images[0]}
              alt="Post attachment"
              loading="lazy"
              className="w-full max-h-[500px] object-cover transition-transform duration-300 group-hover:scale-[1.015]"
            />
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 p-2 rounded-xl text-white backdrop-blur-md">
              <Maximize2 className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* 2 Images Layout */}
        {count === 2 && (
          <div className="grid grid-cols-2 gap-2 h-72 rounded-2xl overflow-hidden">
            {images.map((img, i) => (
              <div
                key={i}
                onClick={() => setLightboxIdx(i)}
                className="group relative h-full w-full overflow-hidden border border-white/10 bg-black/40 shadow-xs cursor-pointer"
              >
                <img
                  src={img}
                  alt={`Attachment ${i + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        )}

        {/* 3 Images Layout (1 large left, 2 stacked right) */}
        {count === 3 && (
          <div className="grid grid-cols-3 gap-2 h-80 rounded-2xl overflow-hidden">
            <div
              onClick={() => setLightboxIdx(0)}
              className="group relative col-span-2 h-full w-full overflow-hidden border border-white/10 bg-black/40 shadow-xs cursor-pointer"
            >
              <img
                src={images[0]}
                alt="Attachment 1"
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="col-span-1 grid grid-rows-2 gap-2 h-full">
              {images.slice(1, 3).map((img, i) => (
                <div
                  key={i + 1}
                  onClick={() => setLightboxIdx(i + 1)}
                  className="group relative h-full w-full overflow-hidden border border-white/10 bg-black/40 shadow-xs cursor-pointer"
                >
                  <img
                    src={img}
                    alt={`Attachment ${i + 2}`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4 Images Layout (2x2 balanced grid) */}
        {count === 4 && (
          <div className="grid grid-cols-2 gap-2 h-80 rounded-2xl overflow-hidden">
            {images.map((img, i) => (
              <div
                key={i}
                onClick={() => setLightboxIdx(i)}
                className="group relative h-full w-full overflow-hidden border border-white/10 bg-black/40 shadow-xs cursor-pointer"
              >
                <img
                  src={img}
                  alt={`Attachment ${i + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        )}

        {/* 5+ Images Layout (2x2 with +N more frosted overlay on 4th cell) */}
        {count >= 5 && (
          <div className="grid grid-cols-2 gap-2 h-80 rounded-2xl overflow-hidden">
            {images.slice(0, 3).map((img, i) => (
              <div
                key={i}
                onClick={() => setLightboxIdx(i)}
                className="group relative h-full w-full overflow-hidden border border-white/10 bg-black/40 shadow-xs cursor-pointer"
              >
                <img
                  src={img}
                  alt={`Attachment ${i + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            ))}
            {/* 4th cell with overlay */}
            <div
              onClick={() => setLightboxIdx(3)}
              className="group relative h-full w-full overflow-hidden border border-white/10 bg-black/40 shadow-xs cursor-pointer"
            >
              <img
                src={images[3]}
                alt="Attachment 4"
                loading="lazy"
                className="w-full h-full object-cover brightness-50 transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center text-white font-black text-2xl tracking-tight">
                +{count - 3}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Fullscreen Lightbox Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center select-none"
          >
            {/* Top Toolbar */}
            <div className="absolute top-4 inset-x-6 z-50 flex items-center justify-between text-white drop-shadow-md">
              <span className="text-xs sm:text-sm font-semibold text-white/80 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
                {lightboxIdx + 1} / {count}
              </span>
              <button
                onClick={() => setLightboxIdx(null)}
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white tap-press transition-colors cursor-pointer"
                aria-label="Close Lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Buttons */}
            {count > 1 && (
              <>
                <button
                  onClick={() => setLightboxIdx((prev) => (prev !== null && prev > 0 ? prev - 1 : count - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white tap-press transition-all z-50 cursor-pointer"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setLightboxIdx((prev) => (prev !== null && prev < count - 1 ? prev + 1 : 0))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white tap-press transition-all z-50 cursor-pointer"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Image Container */}
            <div
              className="relative max-w-5xl max-h-[85vh] p-4 flex items-center justify-center cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img
                key={lightboxIdx}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                src={images[lightboxIdx]}
                alt={`Expanded attachment ${lightboxIdx + 1}`}
                className="max-h-[80vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
