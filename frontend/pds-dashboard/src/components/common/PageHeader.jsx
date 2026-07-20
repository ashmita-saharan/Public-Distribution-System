export default function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 text-base text-slate-500">{subtitle}</p>
      ) : null}
    </div>
  );
}