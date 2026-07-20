export default function AppShell({
  children,
  search,
  setSearch,
  onRefresh,
}) {
  return (
    <div className="min-h-screen app-bg text-slate-900">
      <div className="pds-illustration-fade-right" />
      <div className="pds-illustration-bottom-right" />
      <div className="pds-illustration-bottom-left" />

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8 flex flex-col lg:flex-row gap-6">
        {children}
      </div>
    </div>
  );
}