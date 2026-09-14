import { Eye, ArrowLeft, PlusCircle, CheckCircle2, Rocket, SearchX, ShieldCheck } from "lucide-react";
import { DataTable } from "./DataTable";
import { LEVELS, keyMetric, parentOf } from "../../lib/levelConfig";

const StatusPill = ({ status }) => {
  const map = {
    Active: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300",
    Prospect: "bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/40 dark:text-sky-300",
    "Under Review": "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300",
    Onboarding: "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-300",
    Dormant: "bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-700 dark:text-slate-300",
  };
  return <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${map[status] || map.Dormant}`}>{status}</span>;
};

const LevelBadge = ({ code }) => {
  const l = LEVELS[code];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${l.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${l.dot}`} /> {code}
    </span>
  );
};

export const StepResults = ({ level, rows, loading, onPreview, onSelect, onCreateNew, onBack }) => {
  const columns = [
    { id: "level", header: "Level", accessor: (r) => r.level, filter: "select", render: (r) => <LevelBadge code={r.level} /> },
    { id: "name", header: "Name", accessor: (r) => r.name, filter: "text", render: (r) => <span className="font-medium text-slate-800 dark:text-slate-100">{r.name}</span> },
    { id: "relationshipId", header: "Relationship ID", accessor: (r) => r.relationshipId, filter: "text", render: (r) => <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{r.relationshipId}</span> },
    { id: "country", header: "Country", accessor: (r) => r.country, filter: "select" },
    { id: "industry", header: "Industry", accessor: (r) => r.industry, filter: "select" },
    { id: "status", header: "Status", accessor: (r) => r.status, filter: "select", render: (r) => <StatusPill status={r.status} /> },
    { id: "parent", header: "Parent", accessor: (r) => parentOf(r), sortable: false, render: (r) => <span className="text-slate-500 dark:text-slate-400 text-xs">{parentOf(r)}</span> },
    {
      id: "keyMetric", header: "Key Detail", sortable: false, accessor: (r) => keyMetric(r).value,
      render: (r) => {
        const k = keyMetric(r);
        return (
          <div className="leading-tight">
            <div className="text-[10px] uppercase tracking-wide text-slate-400">{k.label}</div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 font-mono">{k.value}</div>
          </div>
        );
      },
    },
  ];

  const actions = (r) => (
    <div className="flex items-center justify-end gap-1.5">
      <button data-testid={`preview-button-${r.id}`} onClick={() => onPreview(r)} title="Preview details" className="grid place-items-center h-8 w-8 rounded-md border border-slate-300 dark:border-slate-600 text-slate-500 hover:text-[#0176D3] hover:border-[#0176D3] transition-colors duration-150">
        <Eye className="h-4 w-4" />
      </button>
      <button data-testid={`select-button-${r.id}`} onClick={() => onSelect(r)} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#0176D3]/10 dark:bg-sky-500/15 text-[#0176D3] dark:text-sky-300 text-xs font-semibold hover:bg-[#0176D3] hover:text-white transition-colors duration-150">
        <Rocket className="h-3.5 w-3.5" /> Launch
      </button>
    </div>
  );

  const emptyNode = (
    <div data-testid="results-empty" className="flex flex-col items-center justify-center gap-3 py-14 px-6 text-center">
      <div className="grid place-items-center h-14 w-14 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500">
        <SearchX className="h-7 w-7" />
      </div>
      <div>
        <div className="font-heading text-lg font-bold text-slate-800 dark:text-slate-100">No matching records found</div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">Good news — nothing duplicates your search. You can safely create a new {level} · {LEVELS[level].name}.</p>
      </div>
      <button data-testid="empty-create-button" onClick={onCreateNew} className="mt-1 inline-flex items-center gap-2 h-10 px-5 rounded-md bg-[#0176D3] hover:bg-[#014486] text-white font-semibold text-sm transition-colors duration-150">
        <PlusCircle className="h-4 w-4" /> Create new {level} relationship
      </button>
    </div>
  );

  const lvl = LEVELS[level];

  return (
    <div data-testid="step-results" className="animate-fade-up">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[#0176D3] dark:text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
            <ShieldCheck className="h-4 w-4" /> Step 3 of 4
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Review possible matches
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-2xl">
            Results span L1, L2, L3 and L4 records. Refine locally in the table, <strong>preview</strong> a record, and <strong>launch</strong> it if it already exists — otherwise create a new one.
          </p>
        </div>
        <button data-testid="results-create-button" onClick={onCreateNew} className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-[#0176D3] text-[#0176D3] dark:text-sky-300 dark:border-sky-500 text-sm font-semibold hover:bg-[#EEF4FE] dark:hover:bg-sky-900/25 transition-colors duration-150">
          <PlusCircle className="h-4 w-4" /> Create new {level}
        </button>
      </div>

      <div className="mb-3 flex items-center gap-2 text-xs">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-bold ${lvl.badge}`}>Creating: {level} · {lvl.name}</span>
        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium"><CheckCircle2 className="h-3.5 w-3.5" /> Duplicate check</span>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-10 text-center text-sm text-slate-400">Searching records…</div>
      ) : (
        <DataTable rows={rows} columns={columns} actions={actions} emptyNode={emptyNode} />
      )}

      <div className="mt-6 flex items-center justify-between">
        <button data-testid="results-back-button" onClick={onBack} className="inline-flex items-center gap-2 h-11 px-5 rounded-md border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150">
          <ArrowLeft className="h-4 w-4" /> Back to search
        </button>
      </div>
    </div>
  );
};
