import { X, Rocket, Building2 } from "lucide-react";
import { LEVELS, DETAIL_SECTIONS, parentOf } from "../../lib/levelConfig";

const val = (row, key) => {
  if (["name", "relationshipId", "country", "industry", "status"].includes(key)) return row[key];
  return row.attributes?.[key] ?? "—";
};

export const PreviewDrawer = ({ record, onClose, onLaunch }) => {
  if (!record) return null;
  const lvl = LEVELS[record.level];
  const sections = DETAIL_SECTIONS[record.level] || [];

  return (
    <div data-testid="preview-drawer" className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} data-testid="preview-overlay" />
      <aside className="relative w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700 flex flex-col animate-slide-in-right">
        <div className="flex items-start gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
          <div className="grid place-items-center h-10 w-10 rounded-lg bg-[#0176D3] text-white shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${lvl.badge}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${lvl.dot}`} /> {record.level} · {lvl.name}
              </span>
            </div>
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">{record.name}</h3>
            <div className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5">{record.relationshipId}</div>
          </div>
          <button data-testid="preview-close" onClick={onClose} className="grid place-items-center h-8 w-8 rounded-md text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-150">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <section className="mb-5">
            <h4 className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-2">Overview</h4>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              {[["Country", "country"], ["Industry", "industry"], ["Status", "status"], ["Parent", "__parent"]].map(([label, key]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-[11px] text-slate-400">{label}</dt>
                  <dd className="text-sm text-slate-800 dark:text-slate-100 font-medium truncate">{key === "__parent" ? parentOf(record) : val(record, key)}</dd>
                </div>
              ))}
            </dl>
          </section>

          {sections.map((sec) => (
            <section key={sec.title} className="mb-5">
              <h4 className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-2">{sec.title}</h4>
              <dl className="divide-y divide-slate-100 dark:divide-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                {sec.fields.map(([label, key]) => (
                  <div key={key} className="flex items-start justify-between gap-3 px-3 py-2 bg-white dark:bg-slate-800/40">
                    <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
                    <dd className="text-xs font-medium text-slate-800 dark:text-slate-100 text-right font-mono max-w-[60%] break-words">{val(record, key)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex gap-3">
          <button data-testid="preview-close-footer" onClick={onClose} className="flex-1 h-10 rounded-md border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-white dark:hover:bg-slate-700 transition-colors duration-150">
            Close
          </button>
          <button data-testid="preview-launch-button" onClick={() => onLaunch(record)} className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-md bg-[#0176D3] hover:bg-[#014486] text-white text-sm font-semibold transition-colors duration-150">
            <Rocket className="h-4 w-4" /> Launch record
          </button>
        </div>
      </aside>
    </div>
  );
};
