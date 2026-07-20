export default function DataTable({ columns, rows, emptyText = "No data found." }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-white/60 bg-white/75 backdrop-blur-md shadow-[0_8px_30px_rgba(150,130,188,0.10)]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-violet-50/70">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-5 py-4 text-left font-semibold text-slate-600"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-10 text-center text-slate-500"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row.id ?? index}
                  className="border-t border-slate-100/80"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-5 py-4 align-top text-slate-700"
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : String(row[col.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}