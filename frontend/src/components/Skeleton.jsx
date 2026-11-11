export function DoctorCardSkeleton() {
  return (
    <div className="card animate-pulse overflow-hidden">
      <div className="h-56 bg-slate-200" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="h-3 w-20 rounded bg-slate-200" />
      </div>
    </div>
  );
}

export function DoctorGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <DoctorCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function LineSkeleton({ className = "" }) {
  return <div className={`h-4 animate-pulse rounded bg-slate-200 ${className}`} />;
}

export default { DoctorCardSkeleton, DoctorGridSkeleton, LineSkeleton };