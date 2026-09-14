import { MongoClient } from "mongodb"
import { buildSeed } from "./seedData"

const DEFAULT_DB = process.env.MONGODB_DB || process.env.DB_NAME || "commercial_banking"

function buildClient() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it in Project Settings → Vars (enabled for the Development environment) so the preview can reach MongoDB.",
    )
  }

  const options = {}
  const username = process.env.MONGODB_USERNAME
  const password = process.env.MONGODB_PASSWORD
  // Only inject separate credentials when the URI itself has no userinfo.
  const hasInlineCreds = /^mongodb(\+srv)?:\/\/[^/]*@/.test(uri)
  if (!hasInlineCreds && username && password) {
    options.auth = { username, password }
  }

  return new MongoClient(uri, options)
}

// Cache the client across hot-reloads / lambda invocations.
let clientPromise = globalThis.__fcbMongoClientPromise
if (!clientPromise) {
  clientPromise = buildClient().connect()
  globalThis.__fcbMongoClientPromise = clientPromise
}

let seedPromise = globalThis.__fcbSeedPromise

export async function getDb() {
  const client = await clientPromise
  const db = client.db(DEFAULT_DB)

  if (!seedPromise) {
    seedPromise = (async () => {
      const count = await db.collection("accounts").countDocuments({})
      if (count === 0) {
        await db.collection("accounts").insertMany(buildSeed())
      }
    })()
    globalThis.__fcbSeedPromise = seedPromise
  }
  await seedPromise

  return db
}
