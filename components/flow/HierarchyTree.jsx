import { LEVELS } from "../../lib/levelConfig";
import { CornerDownRight } from "lucide-react";

const statusTone = {
  Active: "text-emerald-600 dark:text-emerald-400",
  Prospect: "text-sky-600 dark:text-sky-400",
  "Under Review": "text-amber-600 dark:text-amber-400",
  Onboarding: "text-indigo-600 dark:text-indigo-400",
  Dormant: "text-slate-400",
};

// Flatten the tree into ordered rows with a depth marker (no recursive component).
function flatten(root) {
  const rows = [];
  const walk = (node, depth) => {
    rows.push({ node, depth });
    (node.children || []).forEach((c) => walk(c, depth + 1));
  };
  if (root) walk(root, 0);
  return rows;
}

export const HierarchyTree = ({ tree, loading }) => {
  if (loading) return <div className="text-sm text-slate-400 py-4">Building hierarchy…</div>;
  if (!tree) return null;

  const rows = flatten(tree);

  return (
    <ul data-testid="hierarchy-tree" className="space-y-2">
      {rows.map(({ node, depth }) => {
        const lvl = LEVELS[node.level] || {};
        return (
          <li key={node.id} data-testid={`tree-node-${node.id}`} style={{ marginLeft: depth * 20 }}>
            <div
              className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors duration-150
                ${node.isFocus
                  ? "border-[#0176D3] bg-[#EEF4FE] dark:bg-sky-900/30 dark:border-sky-500 ring-1 ring-[#0176D3]/40"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600"}`}
            >
              {depth > 0 && <CornerDownRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 shrink-0" />}
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${lvl.badge}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${lvl.dot}`} /> {node.level}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                  {node.name}
                  {node.isFocus && <span className="ml-2 text-[10px] uppercase tracking-wide font-bold text-[#0176D3] dark:text-sky-400">This record</span>}
                </div>
                <div className="font-mono text-[11px] text-slate-400 truncate">{node.relationshipId} · {node.country}</div>
              </div>
              <span className={`text-[11px] font-semibold shrink-0 ${statusTone[node.status] || "text-slate-400"}`}>{node.status}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
};
