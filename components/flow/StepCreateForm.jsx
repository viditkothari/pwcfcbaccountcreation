import { useState } from "react";
import { ArrowLeft, Save, AlertCircle, CheckCircle2, Loader2, PlusCircle } from "lucide-react";
import { CREATE_FORM, CORE_KEYS, LEVELS } from "../../lib/levelConfig";

const inputCls =
  "h-10 w-full rounded-md border bg-white dark:bg-slate-900 px-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#0176D3]/25 transition-[border-color,box-shadow] duration-150";

export const StepCreateForm = ({ level, meta, parents, onBack, onSubmit }) => {
  const schema = CREATE_FORM[level];
  const allFields = schema.flatMap((s) => s.fields);
  const [values, setValues] = useState(() => Object.fromEntries(allFields.map((f) => [f.key, f.key === "status" ? "Prospect" : ""])));
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const lvl = LEVELS[level];

  const optionsFor = (f) => {
    if (f.source) return meta[f.source] || [];
    return f.options || [];
  };

  const validateField = (f, v) => {
    if (f.required && (!v || !String(v).trim())) return "This field is required.";
    if (v && f.pattern && !f.pattern.test(String(v).trim())) return f.hint || "Invalid format.";
    return "";
  };

  const validateAll = () => {
    const errs = {};
    allFields.forEach((f) => {
      const e = validateField(f, values[f.key]);
      if (e) errs[f.key] = e;
    });
    setErrors(errs);
    setTouched(Object.fromEntries(allFields.map((f) => [f.key, true])));
    return Object.keys(errs).length === 0;
  };

  const upd = (f, v) => {
    setValues((p) => ({ ...p, [f.key]: v }));
    if (touched[f.key]) setErrors((p) => ({ ...p, [f.key]: validateField(f, v) }));
  };

  const blur = (f) => {
    setTouched((p) => ({ ...p, [f.key]: true }));
    setErrors((p) => ({ ...p, [f.key]: validateField(f, values[f.key]) }));
  };

  const submit = async () => {
    if (!validateAll()) return;
    setSubmitting(true);
    const attributes = {};
    Object.entries(values).forEach(([k, v]) => {
      if (!CORE_KEYS.includes(k) && v !== "" && v != null) attributes[k] = v;
    });
    const payload = {
      level,
      name: values.name,
      relationshipId: values.relationshipId,
      country: values.country,
      industry: values.industry,
      status: values.status,
      attributes,
    };
    try {
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  const requiredCount = allFields.filter((f) => f.required).length;
  const filledRequired = allFields.filter((f) => f.required && values[f.key] && String(values[f.key]).trim()).length;

  const renderField = (f) => {
    const err = touched[f.key] && errors[f.key];
    const border = err ? "border-red-400 dark:border-red-500" : "border-slate-300 dark:border-slate-600 focus:border-[#0176D3]";
    return (
      <div key={f.key} className={f.key === "name" ? "sm:col-span-2" : ""} data-testid={`formfield-${f.key}`}>
        <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
          {f.label} {f.required && <span className="text-red-500">*</span>}
        </label>
        {f.type === "picklist" ? (
          <select data-testid={`create-${f.key}-select`} className={`${inputCls} ${border}`} value={values[f.key]} onChange={(e) => upd(f, e.target.value)} onBlur={() => blur(f)}>
            <option value="">Select…</option>
            {optionsFor(f).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : f.type === "parent" ? (
          <select data-testid={`create-${f.key}-select`} className={`${inputCls} ${border}`} value={values[f.key]} onChange={(e) => upd(f, e.target.value)} onBlur={() => blur(f)}>
            <option value="">Select parent relationship…</option>
            {parents.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        ) : (
          <input
            data-testid={`create-${f.key}-input`}
            className={`${inputCls} ${border} ${f.key === "relationshipId" ? "font-mono" : ""}`}
            placeholder={f.placeholder}
            value={values[f.key]}
            onChange={(e) => upd(f, e.target.value)}
            onBlur={() => blur(f)}
          />
        )}
        {err ? (
          <div className="flex items-center gap-1 text-[11px] text-red-500 mt-1"><AlertCircle className="h-3 w-3" /> {err}</div>
        ) : f.hint ? (
          <div className="text-[11px] text-slate-400 mt-1">{f.hint}</div>
        ) : null}
      </div>
    );
  };

  return (
    <div data-testid="step-create-form" className="animate-fade-up">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[#0176D3] dark:text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
            <PlusCircle className="h-4 w-4" /> Step 4 of 4
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Create new {lvl.name}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Populate the details below. Fields marked <span className="text-red-500 font-semibold">*</span> are required.</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold ${lvl.badge}`}>{level} · {lvl.name}</span>
      </div>

      {/* completion meter */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div className="h-full bg-[#0176D3] transition-[width] duration-300" style={{ width: `${(filledRequired / requiredCount) * 100}%` }} />
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
          {filledRequired === requiredCount && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
          {filledRequired}/{requiredCount} required
        </span>
      </div>

      <div className="space-y-4">
        {schema.map((sec) => (
          <div key={sec.section} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 shadow-sm overflow-hidden">
            <div className="px-5 h-11 flex items-center border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{sec.section}</span>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sec.fields.map(renderField)}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button data-testid="create-back-button" onClick={onBack} className="inline-flex items-center gap-2 h-11 px-5 rounded-md border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button data-testid="submit-create-account-button" onClick={submit} disabled={submitting} className="inline-flex items-center gap-2 h-11 px-6 rounded-md bg-[#0176D3] hover:bg-[#014486] disabled:opacity-60 text-white font-semibold text-sm transition-colors duration-150 shadow-sm">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {submitting ? "Creating…" : "Create relationship"}
        </button>
      </div>
    </div>
  );
};
