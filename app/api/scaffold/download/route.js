import { buildZip } from "@/lib/sfScaffold"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const buffer = await buildZip()
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=meridianone-salesforce-package.zip",
    },
  })
}
