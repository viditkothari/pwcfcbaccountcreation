import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { getDb } from "@/lib/mongodb"
import { nowIso } from "@/lib/seedData"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const query = {}
  const name = searchParams.get("name")
  const relationshipId = searchParams.get("relationshipId")
  const country = searchParams.get("country")
  const industry = searchParams.get("industry")
  const status = searchParams.get("status")
  const level = searchParams.get("level")

  if (name) query.name = { $regex: name, $options: "i" }
  if (relationshipId) query.relationshipId = { $regex: relationshipId, $options: "i" }
  if (country) query.country = country
  if (industry) query.industry = industry
  if (status) query.status = status
  if (level) query.level = level

  const db = await getDb()
  const docs = await db.collection("accounts").find(query, { projection: { _id: 0 } }).limit(1000).toArray()
  return NextResponse.json(docs)
}

export async function POST(request) {
  const payload = await request.json()

  if (!["L1", "L2"].includes(payload.level)) {
    return NextResponse.json({ detail: "Only L1 and L2 relationships can be created" }, { status: 400 })
  }

  const account = {
    id: randomUUID(),
    level: payload.level,
    name: payload.name,
    relationshipId: payload.relationshipId,
    country: payload.country,
    industry: payload.industry,
    status: payload.status,
    attributes: payload.attributes || {},
    createdAt: nowIso(),
    source: "manual",
  }

  const db = await getDb()
  await db.collection("accounts").insertOne({ ...account })
  return NextResponse.json(account)
}
