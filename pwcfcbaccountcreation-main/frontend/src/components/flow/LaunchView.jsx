import { useEffect, useState } from "react";
import { ArrowLeft, Building2, CheckCircle2, ExternalLink, Star, Sparkles, Network } from "lucide-react";
import { LEVELS, DETAIL_SECTIONS, parentOf } from "../../lib/levelConfig";
import { HierarchyTree } from "./HierarchyTree";
import { api } from "../../lib/api";

const val = (row, key) => {
  if (["name", "relationshipId", "country", "industry", "status"].includes(key)) return row[key];
  return row.attributes?.[key] ?? "—";
};

export const LaunchView = ({ record, isNew, onBack, onRestart }) => {
  const lvl = LEVELS[record.level];
  const sections = DETAIL_SECTIONS[record.level] || [];
  const [tree, setTree] = useState(null);
  const [treeLoading, setTreeLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setTreeLoading(true);
    setTree(null);
    api.hierarchy(record.id)
      .then((d) => { if (active) setTree(d.tree); })
      .catch(() => {})
      .finally(() => { if (active) setTreeLoading(false); });
    return () => { active = false; };
  }, [record.id]);

  return (
    <div data-testid="launch-view" className="animate-fade-up">
      {isNew && (
        <div data-testid="create-success-banner" className="mb-5 flex items-center gap-3 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/25 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <div className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Relationship created successfully</div>
            <div className="text-xs text-emerald-700/80 dark:text-emerald-300/80">The new record has been added and is now available across the CRM.</div>
          </div>
        </div>
      )}

      {/* record header banner */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 shadow-sm overflow-hidden">
        <div className="relative px-6 py-5 bg-[#03234D] dark:bg-[#060d1f] text-white">
          <div className="flex items-start gap-4">
            <div className="grid place-items-center h-14 w-14 rounded-xl bg-[#0176D3] shrink-0">
              <Building2 className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${lvl.badge}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${lvl.dot}`} /> {record.level} · {lvl.name}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-white/60"><Star className="h-3 w-3" /> Relationship</span>
              </div>
              <h1 className="font-heading text-2xl font-bold tracking-tight truncate">{record.name}</h1>
              <div className="font-mono text-xs text-white/60 mt-1">{record.relationshipId} · {record.country}</div>
            </div>
            <button className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors duration-150">
              <ExternalLink className="h-4 w-4" /> Open record
            </button>
          </div>
        </div>

        {/* highlight strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-200 dark:divide-slate-700 border-b border-slate-200 dark:border-slate-700">
          {[["Industry", record.industry], ["Status", record.status], ["Parent", parentOf(record)], ["Source", record.source === "manual" ? "Newly created" : "Existing"]].map(([l, v]) => (
            <div key={l} className="px-4 py-3">
              <div className="text-[10px] uppercase tracking-wide text-slate-400">{l}</div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{v}</div>
            </div>
          ))}
        </div>

        {/* read-only detail */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((sec) => (
            <section key={sec.title}>
              <h4 className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-2">{sec.title}</h4>
              <dl className="rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                {sec.fields.map(([label, key]) => (
                  <div key={key} className="flex items-start justify-between gap-3 px-3 py-2.5 bg-white dark:bg-slate-800/40">
                    <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
                    <dd className="text-xs font-medium text-slate-800 dark:text-slate-100 text-right font-mono max-w-[60%] break-words">{val(record, key)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
        <div className="px-6 pb-4 -mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
          <Sparkles className="h-3.5 w-3.5" /> Read-only view — a real deployment would open the Salesforce record page.
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 h-12 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
          <Network className="h-4 w-4 text-[#0176D3]" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Enterprise hierarchy</span>
          <span className="text-xs text-slate-400 ml-1">L1 → L2 → L3 → L4 roll-up</span>
        </div>
        <div className="p-5">
          <HierarchyTree tree={tree} loading={treeLoading} />
          {!treeLoading && tree && !tree.children?.length && tree.isFocus && (
            <p className="text-xs text-slate-400 mt-2">No sub-records linked yet — as child relationships and entities are added, they will appear here.</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button data-testid="launch-back-button" onClick={onBack} className="inline-flex items-center gap-2 h-11 px-5 rounded-md border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button data-testid="launch-restart-button" onClick={onRestart} className="inline-flex items-center gap-2 h-11 px-5 rounded-md bg-[#0176D3] hover:bg-[#014486] text-white font-semibold text-sm transition-colors duration-150">
          Start a new flow
        </button>
      </div>
    </div>
  );
};
