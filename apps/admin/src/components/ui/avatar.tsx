import { cn } from "@/lib/utils";

const SIZES = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
  xl: "size-20 text-2xl",
} as const;

// Teintes de bleu stables par personne, pour distinguer les élèves d'un coup d'œil.
const TINTS = [
  "bg-primary-soft text-primary-strong",
  "bg-[#e3eefc] text-[#0b3d91]",
  "bg-[#e6f4fb] text-[#0e6a96]",
  "bg-[#dceafd] text-[#1557b0]",
  "bg-[#e8f1f8] text-[#2c5a80]",
];

function tintFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return TINTS[hash % TINTS.length];
}

export function initialsOf(firstName?: string | null, lastName?: string | null) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";
}

export function Avatar({
  firstName,
  lastName,
  src,
  size = "md",
  className,
}: {
  firstName?: string | null;
  lastName?: string | null;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold select-none",
        SIZES[size],
        !src && tintFor(name || "?"),
        className,
      )}
      aria-hidden={!name}
      title={name || undefined}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="size-full object-cover" />
      ) : (
        initialsOf(firstName, lastName)
      )}
    </span>
  );
}
