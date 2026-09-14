// Central config for the 4 relationship levels: badges, table columns, detail
// sections and (for L1/L2) the creation form schema.

export const LEVELS = {
  L1: {
    code: "L1",
    name: "Primary Relationship",
    tagline: "Ultimate parent / global holding entity",
    description:
      "The topmost node of an enterprise hierarchy — the ultimate parent or global holding company under which all other relationships and entities roll up.",
    badge: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-700",
    dot: "bg-blue-500",
    creatable: true,
  },
  L2: {
    code: "L2",
    name: "Intermediate Relationship",
    tagline: "Sub-holding / regional operating group",
    description:
      "A regional or divisional grouping that sits beneath a Primary Relationship and aggregates one or more legal entities.",
    badge: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/50 dark:text-indigo-200 dark:border-indigo-700",
    dot: "bg-indigo-500",
    creatable: true,
  },
  L3: {
    code: "L3",
    name: "Legal Entity",
    tagline: "Incorporated legal entity",
    description:
      "A distinct incorporated legal entity with its own registration, tax identity and regulatory standing.",
    badge: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-700",
    dot: "bg-amber-500",
    creatable: false,
  },
  L4: {
    code: "L4",
    name: "Financial Account",
    tagline: "Booked financial account / facility",
    description:
      "A booked financial account or credit facility held by a legal entity.",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-200 dark:border-emerald-700",
    dot: "bg-emerald-500",
    creatable: false,
  },
};

export const levelOrder = ["L1", "L2", "L3", "L4"];

// A "key metric" column that adapts per level — demonstrates differing columns.
export function keyMetric(row) {
  const a = row.attributes || {};
  switch (row.level) {
    case "L1":
    case "L2":
      return { label: "Credit Rating", value: a.creditRating || "—" };
    case "L3":
      return { label: "Tax ID", value: a.taxId || "—" };
    case "L4":
      return { label: "Balance", value: a.balance || "—" };
    default:
      return { label: "—", value: "—" };
  }
}

export function parentOf(row) {
  const a = row.attributes || {};
  return a.parentRelationship || a.parentEntity || "—";
}

// Detail sections for the preview drawer / launch view, per level.
export const DETAIL_SECTIONS = {
  L1: [
    { title: "General", fields: [["Relationship Manager", "relationshipManager"], ["Segment", "segment"], ["Founded", "foundedYear"], ["Employees", "employees"]] },
    { title: "Financial & Regulatory", fields: [["Credit Rating", "creditRating"], ["Total Exposure", "totalExposure"], ["Annual Revenue", "annualRevenue"], ["KYC Status", "kycStatus"], ["LEI", "lei"]] },
  ],
  L2: [
    { title: "General", fields: [["Parent Relationship", "parentRelationship"], ["Region", "region"], ["Relationship Manager", "relationshipManager"], ["Segment", "segment"]] },
    { title: "Financial & Regulatory", fields: [["Credit Rating", "creditRating"], ["Total Exposure", "totalExposure"], ["KYC Status", "kycStatus"]] },
  ],
  L3: [
    { title: "Entity", fields: [["Parent Relationship", "parentRelationship"], ["Legal Form", "legalForm"], ["Incorporation Date", "incorporationDate"]] },
    { title: "Regulatory", fields: [["Tax ID", "taxId"], ["Regulatory Status", "regulatoryStatus"], ["Registered Address", "registeredAddress"]] },
  ],
  L4: [
    { title: "Account", fields: [["Parent Entity", "parentEntity"], ["Account Type", "accountType"], ["Currency", "currency"], ["Balance", "balance"]] },
    { title: "Details", fields: [["Open Date", "openDate"], ["IBAN", "iban"]] },
  ],
};

// Creation form schema for L1 & L2 (grouped into SLDS-style sections).
export const CREATE_FORM = {
  L1: [
    {
      section: "General Information",
      fields: [
        { key: "name", label: "Relationship Name", type: "text", required: true, placeholder: "e.g. Northwind Global Holdings PLC", core: true },
        { key: "relationshipId", label: "Relationship ID", type: "text", required: true, placeholder: "REL-XXXXXX", core: true, hint: "Format REL-###### (6 digits)", pattern: /^REL-\d{6}$/ },
        { key: "industry", label: "Industry", type: "picklist", required: true, source: "industries", core: true },
        { key: "segment", label: "Segment", type: "picklist", required: true, options: ["Global Corporate", "Large Corporate", "Regional Corporate", "Mid Corporate"] },
      ],
    },
    {
      section: "Financial & Regulatory",
      fields: [
        { key: "creditRating", label: "Credit Rating", type: "picklist", required: true, options: ["AAA", "AA+", "AA", "AA-", "A+", "A", "A-", "BBB+", "BBB", "Unrated"] },
        { key: "totalExposure", label: "Total Exposure", type: "text", placeholder: "$0" },
        { key: "annualRevenue", label: "Annual Revenue", type: "text", placeholder: "$0" },
        { key: "kycStatus", label: "KYC Status", type: "picklist", required: true, options: ["Verified", "In Progress", "Renewal Due", "Not Started"] },
        { key: "lei", label: "Legal Entity Identifier (LEI)", type: "text", placeholder: "20-character LEI", pattern: /^[A-Z0-9]{20}$/, hint: "20 alphanumeric characters" },
      ],
    },
    {
      section: "Location & Relationship",
      fields: [
        { key: "country", label: "Country / Region", type: "picklist", required: true, source: "countries", core: true },
        { key: "relationshipManager", label: "Relationship Manager", type: "text", required: true, placeholder: "Full name" },
        { key: "status", label: "Status", type: "picklist", required: true, source: "statuses", core: true },
      ],
    },
  ],
  L2: [
    {
      section: "General Information",
      fields: [
        { key: "name", label: "Relationship Name", type: "text", required: true, placeholder: "e.g. Northwind EMEA Operating Group", core: true },
        { key: "relationshipId", label: "Relationship ID", type: "text", required: true, placeholder: "REL-XXXXXX", core: true, hint: "Format REL-###### (6 digits)", pattern: /^REL-\d{6}$/ },
        { key: "parentRelationship", label: "Parent (L1) Relationship", type: "parent", required: true, hint: "Link to an existing Primary Relationship" },
        { key: "region", label: "Region", type: "picklist", required: true, options: ["Americas", "EMEA", "APAC", "LATAM"] },
        { key: "industry", label: "Industry", type: "picklist", required: true, source: "industries", core: true },
      ],
    },
    {
      section: "Financial & Regulatory",
      fields: [
        { key: "creditRating", label: "Credit Rating", type: "picklist", required: true, options: ["AAA", "AA+", "AA", "AA-", "A+", "A", "A-", "BBB+", "BBB", "Unrated"] },
        { key: "segment", label: "Segment", type: "picklist", required: true, options: ["Regional Corporate", "Mid Corporate", "Large Corporate"] },
        { key: "totalExposure", label: "Total Exposure", type: "text", placeholder: "$0" },
        { key: "kycStatus", label: "KYC Status", type: "picklist", required: true, options: ["Verified", "In Progress", "Renewal Due", "Not Started"] },
      ],
    },
    {
      section: "Location & Relationship",
      fields: [
        { key: "country", label: "Country / Region", type: "picklist", required: true, source: "countries", core: true },
        { key: "relationshipManager", label: "Relationship Manager", type: "text", required: true, placeholder: "Full name" },
        { key: "status", label: "Status", type: "picklist", required: true, source: "statuses", core: true },
      ],
    },
  ],
};

// Which keys are top-level columns vs stored in attributes.
export const CORE_KEYS = ["name", "relationshipId", "country", "industry", "status"];
