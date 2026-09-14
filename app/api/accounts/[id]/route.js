import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request, { params }) {
  const { id } = await params
  const db = await getDb()
  const doc = await db.collection("accounts").findOne({ id }, { projection: { _id: 0 } })
  if (!doc) {
    return NextResponse.json({ detail: "Account not found" }, { status: 404 })
  }
  return NextResponse.json(doc)
}
