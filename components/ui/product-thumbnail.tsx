"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

type ProductThumbnailProps = {
  src: string | null | undefined;
  alt: string;
  size?: number;
  className?: string;
};

export function ProductThumbnail({
  src,
  alt,
  size = 80,
  className,
}: ProductThumbnailProps) {
  if (src) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-xl border border-black/10 bg-gray-100",
          className,
        )}
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={`${size}px`}
          className="object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl border border-black/10 bg-gray-100 text-xs font-semibold uppercase text-gray-400",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      —
    </div>
  );
}
