export default function EmptyState({ icon = "🗂️", title = "Nothing here yet", message, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
      <div className="mb-3 text-4xl">{icon}</div>
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {message && <p className="mt-1 max-w-md text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}