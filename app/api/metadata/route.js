import { NextResponse } from "next/server"
import { COUNTRIES, INDUSTRIES, STATUSES, LEVELS } from "@/lib/seedData"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({
    countries: COUNTRIES,
    industries: INDUSTRIES,
    statuses: STATUSES,
    levels: LEVELS,
  })
}
