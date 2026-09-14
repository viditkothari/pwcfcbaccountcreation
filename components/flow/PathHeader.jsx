import { Check, ChevronRight } from "lucide-react";

const STEPS = [
  { id: 1, label: "Select Level" },
  { id: 2, label: "Search & Validate" },
  { id: 3, label: "Review Matches" },
  { id: 4, label: "Account Action" },
];

// SLDS-style progress "path" component.
export const PathHeader = ({ current, onStepClick, maxReached }) => {
  return (
    <div data-testid="path-header" className="w-full overflow-x-auto">
      <ol className="flex items-stretch min-w-max rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60">
        {STEPS.map((s, idx) => {
          const done = s.id < current;
          const active = s.id === current;
          const reachable = s.id <= maxReached;
          return (
            <li key={s.id} className="flex-1 min-w-[180px]">
              <button
                data-testid={`path-step-${s.id}`}
                disabled={!reachable}
                onClick={() => reachable && onStepClick(s.id)}
                className={`relative w-full h-12 pl-6 pr-3 flex items-center gap-2.5 text-sm font-medium transition-colors duration-150
                  ${active ? "bg-[#0176D3] text-white" : done ? "bg-[#EAF3FC] dark:bg-sky-900/30 text-[#0176D3] dark:text-sky-300" : "text-slate-500 dark:text-slate-400"}
                  ${reachable && !active ? "hover:bg-slate-50 dark:hover:bg-slate-700/50" : ""}
                  ${!reachable ? "cursor-not-allowed opacity-70" : ""}`}
              >
                <span className={`grid place-items-center h-5 w-5 rounded-full text-[11px] font-bold shrink-0 border
                  ${active ? "bg-white text-[#0176D3] border-white" : done ? "bg-[#0176D3] text-white border-[#0176D3]" : "border-slate-300 dark:border-slate-600"}`}>
                  {done ? <Check className="h-3 w-3" strokeWidth={3} /> : s.id}
                </span>
                <span className="truncate">{s.label}</span>
                {idx < STEPS.length - 1 && (
                  <ChevronRight className={`absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 ${active ? "text-white/60" : "text-slate-300 dark:text-slate-600"}`} />
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
