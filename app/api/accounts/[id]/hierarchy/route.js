import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function parentName(d) {
  const a = d.attributes || {}
  return a.parentRelationship || a.parentEntity || null
}

export async function GET(request, { params }) {
  const { id } = await params
  const db = await getDb()
  const docs = await db.collection("accounts").find({}, { projection: { _id: 0 } }).limit(2000).toArray()

  const byName = {}
  for (const d of docs) byName[d.name] = d

  const focus = docs.find((d) => d.id === id)
  if (!focus) {
    return NextResponse.json({ detail: "Account not found" }, { status: 404 })
  }

  // Walk up to the ultimate parent (root).
  let root = focus
  const seen = new Set()
  while (true) {
    const pn = parentName(root)
    if (pn && byName[pn] && !seen.has(byName[pn].id)) {
      seen.add(root.id)
      root = byName[pn]
    } else {
      break
    }
  }

  const childrenOf = {}
  for (const d of docs) {
    const pn = parentName(d)
    if (pn) {
      if (!childrenOf[pn]) childrenOf[pn] = []
      childrenOf[pn].push(d)
    }
  }

  const build = (node, visited = new Set()) => {
    visited.add(node.id)
    const kids = (childrenOf[node.name] || [])
      .slice()
      .sort((a, b) => (a.level + a.name).localeCompare(b.level + b.name))
    return {
      id: node.id,
      level: node.level,
      name: node.name,
      relationshipId: node.relationshipId,
      status: node.status,
      country: node.country,
      industry: node.industry,
      isFocus: node.id === id,
      children: kids.filter((k) => !visited.has(k.id)).map((k) => build(k, visited)),
    }
  }

  return NextResponse.json({ focusId: id, tree: build(root) })
}
