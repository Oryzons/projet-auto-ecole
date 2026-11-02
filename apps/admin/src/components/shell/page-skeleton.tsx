import { Skeleton } from "@/components/ui/skeleton";

/** Squelette affiché instantanément pendant le chargement d'une page. */
export function PageSkeleton() {
  return (
    <div className="animate-in space-y-6 fade-in duration-300" role="status" aria-label="Chargement de la page">
      <div className="space-y-2.5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className={i === 2 ? "col-span-2 h-24 rounded-2xl xl:col-span-1" : "h-24 rounded-2xl"} />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}
