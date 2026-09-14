import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import { PathHeader } from "./PathHeader";
import { StepLevelSelect } from "./StepLevelSelect";
import { StepSearch } from "./StepSearch";
import { StepResults } from "./StepResults";
import { StepCreateForm } from "./StepCreateForm";
import { PreviewDrawer } from "./PreviewDrawer";
import { LaunchView } from "./LaunchView";

const emptyFilters = { name: "", relationshipId: "", country: "", industry: "", status: "" };

export const AccountFlow = () => {
  const [step, setStep] = useState(1);
  const [maxReached, setMaxReached] = useState(1);
  const [level, setLevel] = useState(null);
  const [meta, setMeta] = useState({ countries: [], industries: [], statuses: [], levels: [] });
  const [parents, setParents] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [launched, setLaunched] = useState(null);
  const [launchedIsNew, setLaunchedIsNew] = useState(false);

  useEffect(() => {
    api.metadata().then(setMeta).catch(() => toast.error("Could not load metadata"));
    api.search({ level: "L1" }).then((r) => setParents(r.map((x) => x.name))).catch(() => {});
  }, []);

  const go = useCallback((s) => {
    setStep(s);
    setMaxReached((m) => Math.max(m, s));
  }, []);

  const runSearch = async (f) => {
    setLoading(true);
    go(3);
    try {
      const params = {};
      Object.entries(f).forEach(([k, v]) => { if (v) params[k] = v; });
      const data = await api.search(params);
      setRows(data);
      if (data.length === 0) toast.info("No matching records — you can create a new one");
    } catch {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    go(3);
    try {
      setRows(await api.search({}));
    } finally {
      setLoading(false);
    }
  };

  const handleLaunch = (record) => {
    setPreview(null);
    setLaunched(record);
    setLaunchedIsNew(false);
    go(4);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCreate = async (payload) => {
    try {
      const created = await api.create(payload);
      setRows((r) => [created, ...r]);
      if (created.level === "L1") setParents((p) => [...new Set([...p, created.name])]);
      setLaunched(created);
      setLaunchedIsNew(true);
      go(4);
      toast.success(`${created.level} relationship "${created.name}" created`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to create relationship");
      throw e;
    }
  };

  const restart = () => {
    setStep(1); setMaxReached(1); setLevel(null); setFilters(emptyFilters);
    setRows([]); setLaunched(null); setLaunchedIsNew(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [creating, setCreating] = useState(false); // step-4 create-vs-launch discriminator

  const goCreate = () => { setCreating(true); go(4); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const onStepClick = (s) => {
    if (s === 4) return; // step 4 only via actions
    if (s <= 3) { setCreating(false); setLaunched(null); go(s); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <PathHeader current={step} maxReached={maxReached} onStepClick={onStepClick} />
      </div>

      {step === 1 && (
        <StepLevelSelect selected={level} onSelect={setLevel} onNext={() => go(2)} />
      )}

      {step === 2 && (
        <StepSearch
          meta={meta}
          level={level}
          filters={filters}
          setFilters={setFilters}
          onSearch={runSearch}
          onDemo={loadAll}
          onBack={() => go(1)}
        />
      )}

      {step === 3 && (
        <StepResults
          level={level}
          rows={rows}
          loading={loading}
          onPreview={setPreview}
          onSelect={handleLaunch}
          onCreateNew={goCreate}
          onBack={() => go(2)}
        />
      )}

      {step === 4 && creating && (
        <StepCreateForm
          level={level}
          meta={meta}
          parents={parents}
          onBack={() => { setCreating(false); go(3); }}
          onSubmit={async (p) => { await handleCreate(p); setCreating(false); }}
        />
      )}

      {step === 4 && !creating && launched && (
        <LaunchView
          record={launched}
          isNew={launchedIsNew}
          onBack={() => { setLaunched(null); go(3); }}
          onRestart={restart}
        />
      )}

      <PreviewDrawer record={preview} onClose={() => setPreview(null)} onLaunch={handleLaunch} />
    </div>
  );
};
