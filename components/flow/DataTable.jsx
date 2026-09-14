import { useMemo, useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, ChevronLeft, ChevronRight, FilterX } from "lucide-react";

// Client-side, in-browser filterable/sortable/paginated table (DataTables.net-style).
export const DataTable = ({ rows, columns, actions, emptyNode, testid = "data-table" }) => {
  const [globalQ, setGlobalQ] = useState("");
  const [colFilters, setColFilters] = useState({});
  const [sort, setSort] = useState({ id: null, dir: "asc" });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const setColFilter = (id, v) => {
    setColFilters((p) => ({ ...p, [id]: v }));
    setPage(0);
  };

  const clearAll = () => {
    setGlobalQ("");
    setColFilters({});
    setPage(0);
  };

  const filtered = useMemo(() => {
    const gq = globalQ.trim().toLowerCase();
    let out = rows.filter((r) => {
      // global
      if (gq) {
        const hay = columns.map((c) => String(c.accessor(r) ?? "")).join(" ").toLowerCase();
        if (!hay.includes(gq)) return false;
      }
      // per-column
      for (const c of columns) {
        const f = colFilters[c.id];
        if (!f) continue;
        const val = String(c.accessor(r) ?? "").toLowerCase();
        if (c.filter === "select") {
          if (val !== String(f).toLowerCase()) return false;
        } else if (!val.includes(String(f).toLowerCase())) return false;
      }
      return true;
    });

    if (sort.id) {
      const col = columns.find((c) => c.id === sort.id);
      out = [...out].sort((a, b) => {
        const av = String(col.accessor(a) ?? "");
        const bv = String(col.accessor(b) ?? "");
        const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" });
        return sort.dir === "asc" ? cmp : -cmp;
      });
    }
    return out;
  }, [rows, columns, globalQ, colFilters, sort]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const curPage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(curPage * pageSize, curPage * pageSize + pageSize);

  const toggleSort = (id) =>
    setSort((p) => (p.id === id ? { id, dir: p.dir === "asc" ? "desc" : "asc" } : { id, dir: "asc" }));

  const selectOptions = (col) => {
    const s = new Set(rows.map((r) => String(col.accessor(r) ?? "")).filter(Boolean));
    return Array.from(s).sort();
  };

  const anyFilter = globalQ || Object.values(colFilters).some(Boolean);

  return (
    <div data-testid={testid} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 shadow-sm overflow-hidden">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md px-3 h-9 min-w-[240px]">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            data-testid="table-global-search"
            value={globalQ}
            onChange={(e) => { setGlobalQ(e.target.value); setPage(0); }}
            placeholder="Filter results in this table…"
            className="bg-transparent outline-none text-sm w-full text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>
        {anyFilter && (
          <button data-testid="table-clear-filters" onClick={clearAll} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#0176D3] transition-colors duration-150">
            <FilterX className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
        <div className="ml-auto flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span data-testid="table-result-count">{total} record{total !== 1 && "s"}</span>
          <select
            data-testid="table-page-size"
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
            className="h-8 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 text-xs"
          >
            {[5, 10, 25, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100/80 dark:bg-slate-800 text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {columns.map((c) => (
                <th key={c.id} className="text-left font-semibold px-3 py-2.5 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                  <button
                    onClick={() => c.sortable !== false && toggleSort(c.id)}
                    className={`inline-flex items-center gap-1 ${c.sortable !== false ? "hover:text-[#0176D3]" : "cursor-default"} transition-colors duration-150`}
                  >
                    {c.header}
                    {c.sortable !== false && (
                      sort.id === c.id ? (sort.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </button>
                </th>
              ))}
              {actions && <th className="px-3 py-2.5 border-b border-slate-200 dark:border-slate-700 text-right">Actions</th>}
            </tr>
            {/* column filter row */}
            <tr className="bg-white dark:bg-slate-800/40">
              {columns.map((c) => (
                <th key={c.id} className="px-3 pb-2 pt-1 border-b border-slate-200 dark:border-slate-700 align-top">
                  {c.filter === "select" ? (
                    <select
                      data-testid={`colfilter-${c.id}`}
                      value={colFilters[c.id] || ""}
                      onChange={(e) => setColFilter(c.id, e.target.value)}
                      className="h-7 w-full rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-1.5 text-xs font-normal text-slate-600 dark:text-slate-300"
                    >
                      <option value="">All</option>
                      {selectOptions(c).map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : c.filter === "text" ? (
                    <input
                      data-testid={`colfilter-${c.id}`}
                      value={colFilters[c.id] || ""}
                      onChange={(e) => setColFilter(c.id, e.target.value)}
                      placeholder="Filter…"
                      className="h-7 w-full rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-1.5 text-xs font-normal text-slate-600 dark:text-slate-300 placeholder:text-slate-300"
                    />
                  ) : null}
                </th>
              ))}
              {actions && <th className="border-b border-slate-200 dark:border-slate-700" />}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="p-0">
                  {emptyNode}
                </td>
              </tr>
            ) : (
              pageRows.map((r, i) => (
                <tr key={r.id} data-testid={`table-row-${r.id}`} className={`${i % 2 ? "bg-slate-50/50 dark:bg-slate-800/30" : ""} hover:bg-[#EEF4FE] dark:hover:bg-sky-900/20 transition-colors duration-100`}>
                  {columns.map((c) => (
                    <td key={c.id} className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-700/60 align-middle whitespace-nowrap">
                      {c.render ? c.render(r) : String(c.accessor(r) ?? "—")}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-700/60 text-right whitespace-nowrap">
                      {actions(r)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing {curPage * pageSize + 1}–{Math.min(total, (curPage + 1) * pageSize)} of {total}
          </span>
          <div className="flex items-center gap-1">
            <button data-testid="table-prev-page" disabled={curPage === 0} onClick={() => setPage(curPage - 1)} className="inline-flex items-center gap-1 h-7 px-2 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-40 hover:bg-white dark:hover:bg-slate-700 transition-colors duration-150">
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <span className="px-2">Page {curPage + 1} / {pageCount}</span>
            <button data-testid="table-next-page" disabled={curPage >= pageCount - 1} onClick={() => setPage(curPage + 1)} className="inline-flex items-center gap-1 h-7 px-2 rounded border border-slate-300 dark:border-slate-600 disabled:opacity-40 hover:bg-white dark:hover:bg-slate-700 transition-colors duration-150">
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
