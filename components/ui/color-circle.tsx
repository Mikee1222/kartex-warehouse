import { cn } from "@/lib/utils";

type ColorCircleProps = {
  hex: string;
  size?: number;
  className?: string;
  title?: string;
};

export function ColorCircle({
  hex,
  size = 32,
  className,
  title,
}: ColorCircleProps) {
  return (
    <span
      title={title}
      className={cn(
        "inline-block shrink-0 rounded-full border border-white/15 shadow-inner",
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: hex,
      }}
      aria-hidden={title ? undefined : true}
    />
  );
}
