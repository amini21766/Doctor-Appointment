export default function Loading({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <span className="inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
      <span className="text-sm">{label}</span>
    </div>
  );
}