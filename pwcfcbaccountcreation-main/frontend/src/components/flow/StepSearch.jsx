import { useState } from "react";
import { Search, RotateCcw, ArrowRight, ArrowLeft, SlidersHorizontal, Sparkles } from "lucide-react";
import { LEVELS } from "../../lib/levelConfig";

const Field = ({ label, children, testid }) => (
  <div className="flex flex-col gap-1.5" data-testid={testid}>
    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</label>
    {children}
  </div>
);

const inputCls =
  "h-10 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-[#0176D3] focus:ring-2 focus:ring-[#0176D3]/25 transition-[border-color,box-shadow] duration-150";

export const StepSearch = ({ meta, level, filters, setFilters, onSearch, onBack, onDemo }) => {
  const [local, setLocal] = useState(filters);
  const lvl = LEVELS[level];

  const upd = (k, v) => setLocal((p) => ({ ...p, [k]: v }));
  const reset = () => setLocal({ name: "", relationshipId: "", country: "", industry: "", status: "" });

  const submit = () => {
    setFilters(local);
    onSearch(local);
  };

  const demo = () => {
    const preset = { name: "", relationshipId: "", country: "", industry: "", status: "" };
    setLocal(preset);
    setFilters(preset);
    onDemo(preset);
  };

  return (
    <div data-testid="step-search" className="animate-fade-up">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[#0176D3] dark:text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
            <Search className="h-4 w-4" /> Step 2 of 4
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Validate before you create
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            Search existing relationships and entities to make sure this{" "}
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[11px] font-bold align-middle ${lvl.badge}`}>{level} · {lvl.name}</span>{" "}
            doesn't already exist.
          </p>
        </div>
        <button data-testid="demo-preset-button" onClick={demo} className="inline-flex items-center gap-2 h-9 px-3.5 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-sm font-medium hover:bg-amber-100 transition-colors duration-150">
          <Sparkles className="h-4 w-4" /> Load all sample records
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 h-11 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Search filters</span>
          <span className="text-xs text-slate-400 ml-1">5 criteria</span>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Relationship / Account Name" testid="filter-name">
            <input className={inputCls} data-testid="search-name-input" placeholder="e.g. Apex, Horizon…" value={local.name} onChange={(e) => upd("name", e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
          </Field>
          <Field label="Relationship ID" testid="filter-relationship-id">
            <input className={`${inputCls} font-mono`} data-testid="search-relationshipid-input" placeholder="REL-100045" value={local.relationshipId} onChange={(e) => upd("relationshipId", e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
          </Field>
          <Field label="Country / Region" testid="filter-country">
            <select className={inputCls} data-testid="search-country-select" value={local.country} onChange={(e) => upd("country", e.target.value)}>
              <option value="">All countries</option>
              {meta.countries.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Industry" testid="filter-industry">
            <select className={inputCls} data-testid="search-industry-select" value={local.industry} onChange={(e) => upd("industry", e.target.value)}>
              <option value="">All industries</option>
              {meta.industries.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Status" testid="filter-status">
            <select className={inputCls} data-testid="search-status-select" value={local.status} onChange={(e) => upd("status", e.target.value)}>
              <option value="">Any status</option>
              {meta.statuses.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <div className="flex items-end">
            <button data-testid="reset-filters-button" onClick={reset} className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150 w-full justify-center">
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button data-testid="search-back-button" onClick={onBack} className="inline-flex items-center gap-2 h-11 px-5 rounded-md border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button data-testid="run-search-button" onClick={submit} className="inline-flex items-center gap-2 h-11 px-6 rounded-md bg-[#0176D3] hover:bg-[#014486] text-white font-semibold text-sm transition-colors duration-150 shadow-sm">
          <Search className="h-4 w-4" /> Search relationships <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
