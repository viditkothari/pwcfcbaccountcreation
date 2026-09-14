import { Layers, Info, ArrowRight, Lock } from "lucide-react";
import { LEVELS, levelOrder } from "../../lib/levelConfig";

export const StepLevelSelect = ({ selected, onSelect, onNext }) => {
  return (
    <div data-testid="step-level-select" className="animate-fade-up">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-[#0176D3] dark:text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
          <Layers className="h-4 w-4" /> Step 1 of 4
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          What would you like to create?
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-2xl">
          Choose the relationship level for the new record. Only <strong className="text-slate-700 dark:text-slate-200">Primary</strong> and{" "}
          <strong className="text-slate-700 dark:text-slate-200">Intermediate</strong> relationships can be created here — Legal Entities and Financial Accounts are managed downstream.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {levelOrder.filter((code) => LEVELS[code].creatable).map((code) => {
          const lvl = LEVELS[code];
          const isSel = selected === code;
          const disabled = !lvl.creatable;
          return (
            <button
              key={code}
              data-testid={`level-card-${code}`}
              disabled={disabled}
              onClick={() => !disabled && onSelect(code)}
              className={`group relative text-left rounded-xl border p-5 transition-[box-shadow,border-color,background-color] duration-200
                ${isSel
                  ? "border-[#0176D3] bg-[#EEF4FE] dark:bg-sky-900/25 dark:border-sky-500 shadow-md ring-1 ring-[#0176D3]"
                  : disabled
                  ? "border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 cursor-not-allowed"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 hover:border-[#0176D3] hover:shadow-md"}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${lvl.badge}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${lvl.dot}`} />
                  {code} · {lvl.name}
                </span>
                {disabled ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                    <Lock className="h-3 w-3" /> View only
                  </span>
                ) : (
                  <span className={`grid place-items-center h-5 w-5 rounded-full border-2 transition-colors duration-150 ${isSel ? "border-[#0176D3] bg-[#0176D3]" : "border-slate-300 dark:border-slate-600 group-hover:border-[#0176D3]"}`}>
                    {isSel && <span className="h-2 w-2 rounded-full bg-white" />}
                  </span>
                )}
              </div>
              <div className="text-[13px] uppercase tracking-wide text-slate-400 dark:text-slate-500 font-semibold mb-0.5">{lvl.tagline}</div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{lvl.description}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-[#0176D3]" />
        <span>Creating the right level keeps the hierarchy clean: <strong>L1</strong> → <strong>L2</strong> → <strong>L3 Legal Entity</strong> → <strong>L4 Financial Account</strong>. You will search for possible duplicates before the record is created.</span>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          data-testid="level-next-button"
          disabled={!selected}
          onClick={onNext}
          className="inline-flex items-center gap-2 h-11 px-6 rounded-md bg-[#0176D3] hover:bg-[#014486] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors duration-150 shadow-sm"
        >
          Next: Search & Validate <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
