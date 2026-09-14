from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, BeforeValidator
from typing import List, Optional, Dict, Any, Annotated
from bson import ObjectId
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Commercial Banking Relationship API")
api_router = APIRouter(prefix="/api")

# ---------------------------------------------------------------------------
# Mongo helpers
# ---------------------------------------------------------------------------
PyObjectId = Annotated[str, BeforeValidator(str)]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class AccountBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    level: str  # L1 | L2 | L3 | L4
    name: str
    relationshipId: str
    country: str
    industry: str
    status: str
    attributes: Dict[str, Any] = Field(default_factory=dict)


class Account(AccountBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    createdAt: str = Field(default_factory=now_iso)
    source: str = "seed"


class AccountCreate(AccountBase):
    pass


# ---------------------------------------------------------------------------
# Static metadata (picklists)
# ---------------------------------------------------------------------------
COUNTRIES = [
    "United States", "United Kingdom", "Germany", "France", "Singapore",
    "Japan", "United Arab Emirates", "Canada", "Australia", "Switzerland",
    "Netherlands", "Hong Kong SAR",
]
INDUSTRIES = [
    "Financial Services", "Energy & Utilities", "Retail & Consumer",
    "Industrial Manufacturing", "Technology", "Healthcare & Pharma",
    "Real Estate", "Transportation & Logistics", "Telecommunications",
    "Aerospace & Defense",
]
STATUSES = ["Active", "Prospect", "Under Review", "Dormant", "Onboarding"]
LEVELS = [
    {"code": "L1", "name": "Primary Relationship", "tagline": "Ultimate parent / global holding entity"},
    {"code": "L2", "name": "Intermediate Relationship", "tagline": "Sub-holding / regional operating group"},
    {"code": "L3", "name": "Legal Entity", "tagline": "Incorporated legal entity"},
    {"code": "L4", "name": "Financial Account", "tagline": "Booked financial account / facility"},
]


@api_router.get("/")
async def root():
    return {"message": "Commercial Banking Relationship API"}


@api_router.get("/metadata")
async def get_metadata():
    return {
        "countries": COUNTRIES,
        "industries": INDUSTRIES,
        "statuses": STATUSES,
        "levels": LEVELS,
    }


# ---------------------------------------------------------------------------
# Search / list
# ---------------------------------------------------------------------------
@api_router.get("/accounts", response_model=List[Account])
async def list_accounts(
    name: Optional[str] = None,
    relationshipId: Optional[str] = None,
    country: Optional[str] = None,
    industry: Optional[str] = None,
    status: Optional[str] = None,
    level: Optional[str] = None,
):
    query: Dict[str, Any] = {}
    if name:
        query["name"] = {"$regex": name, "$options": "i"}
    if relationshipId:
        query["relationshipId"] = {"$regex": relationshipId, "$options": "i"}
    if country:
        query["country"] = country
    if industry:
        query["industry"] = industry
    if status:
        query["status"] = status
    if level:
        query["level"] = level

    docs = await db.accounts.find(query, {"_id": 0}).to_list(1000)
    return [Account(**d) for d in docs]


@api_router.get("/accounts/{account_id}", response_model=Account)
async def get_account(account_id: str):
    doc = await db.accounts.find_one({"id": account_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Account not found")
    return Account(**doc)


@api_router.post("/accounts", response_model=Account)
async def create_account(payload: AccountCreate):
    if payload.level not in ("L1", "L2"):
        raise HTTPException(status_code=400, detail="Only L1 and L2 relationships can be created")
    account = Account(**payload.model_dump(), source="manual")
    await db.accounts.insert_one(account.model_dump())
    return account


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------
def build_seed() -> List[Dict[str, Any]]:
    records: List[Dict[str, Any]] = []

    def rec(level, name, rid, country, industry, status, attrs):
        records.append({
            "id": str(uuid.uuid4()),
            "level": level,
            "name": name,
            "relationshipId": rid,
            "country": country,
            "industry": industry,
            "status": status,
            "attributes": attrs,
            "createdAt": now_iso(),
            "source": "seed",
        })

    # ---- L1 Primary Relationships ----
    rec("L1", "Apex Global Holdings PLC", "REL-100045", "United Kingdom", "Financial Services", "Active", {
        "creditRating": "AA-", "segment": "Global Corporate", "totalExposure": "$4.2B",
        "relationshipManager": "Eleanor Whitfield", "kycStatus": "Verified",
        "annualRevenue": "$28.4B", "employees": 41200, "foundedYear": 1987, "lei": "5493001KJTIIGC8Y1R12"})
    rec("L1", "Horizon Energy Holdings Inc", "REL-100112", "United States", "Energy & Utilities", "Active", {
        "creditRating": "A+", "segment": "Global Corporate", "totalExposure": "$6.8B",
        "relationshipManager": "Marcus Delgado", "kycStatus": "Verified",
        "annualRevenue": "$52.1B", "employees": 63800, "foundedYear": 1974, "lei": "254900HROIFWPRGM1V77"})
    rec("L1", "Pacific Retail Group Ltd", "REL-100238", "Singapore", "Retail & Consumer", "Active", {
        "creditRating": "A", "segment": "Large Corporate", "totalExposure": "$1.9B",
        "relationshipManager": "Priya Nair", "kycStatus": "Verified",
        "annualRevenue": "$14.7B", "employees": 22900, "foundedYear": 1996, "lei": "894500RXCBH5PZDCFR41"})
    rec("L1", "Meridian Financial Group", "REL-100301", "Switzerland", "Financial Services", "Under Review", {
        "creditRating": "AA", "segment": "Global Corporate", "totalExposure": "$9.1B",
        "relationshipManager": "Lukas Berger", "kycStatus": "Renewal Due",
        "annualRevenue": "$33.9B", "employees": 38400, "foundedYear": 1962, "lei": "506700GE1G29325QX363"})
    rec("L1", "Vanguard Industrial Holdings", "REL-100377", "Germany", "Industrial Manufacturing", "Prospect", {
        "creditRating": "A-", "segment": "Large Corporate", "totalExposure": "$0",
        "relationshipManager": "Sabine Vogt", "kycStatus": "In Progress",
        "annualRevenue": "$19.2B", "employees": 27600, "foundedYear": 1981, "lei": "391200XYZ3P9QW8L7K22"})

    # ---- L2 Intermediate Relationships ----
    rec("L2", "Apex Americas Regional Group", "REL-200091", "United States", "Financial Services", "Active", {
        "parentRelationship": "Apex Global Holdings PLC", "region": "Americas",
        "creditRating": "A+", "relationshipManager": "Grace Sullivan", "kycStatus": "Verified",
        "totalExposure": "$1.6B", "segment": "Regional Corporate"})
    rec("L2", "Apex EMEA Operating Group", "REL-200104", "United Kingdom", "Financial Services", "Active", {
        "parentRelationship": "Apex Global Holdings PLC", "region": "EMEA",
        "creditRating": "A+", "relationshipManager": "Eleanor Whitfield", "kycStatus": "Verified",
        "totalExposure": "$2.1B", "segment": "Regional Corporate"})
    rec("L2", "Horizon Renewables Division", "REL-200187", "United States", "Energy & Utilities", "Active", {
        "parentRelationship": "Horizon Energy Holdings Inc", "region": "Americas",
        "creditRating": "A", "relationshipManager": "Marcus Delgado", "kycStatus": "Verified",
        "totalExposure": "$2.7B", "segment": "Regional Corporate"})
    rec("L2", "Horizon Gas & Midstream APAC", "REL-200205", "Australia", "Energy & Utilities", "Onboarding", {
        "parentRelationship": "Horizon Energy Holdings Inc", "region": "APAC",
        "creditRating": "A-", "relationshipManager": "Owen Fletcher", "kycStatus": "In Progress",
        "totalExposure": "$0.8B", "segment": "Regional Corporate"})
    rec("L2", "Pacific Retail Logistics APAC", "REL-200266", "Hong Kong SAR", "Transportation & Logistics", "Active", {
        "parentRelationship": "Pacific Retail Group Ltd", "region": "APAC",
        "creditRating": "A-", "relationshipManager": "Priya Nair", "kycStatus": "Verified",
        "totalExposure": "$0.6B", "segment": "Mid Corporate"})
    rec("L2", "Meridian Capital Markets EU", "REL-200319", "France", "Financial Services", "Under Review", {
        "parentRelationship": "Meridian Financial Group", "region": "EMEA",
        "creditRating": "AA-", "relationshipManager": "Camille Rousseau", "kycStatus": "Renewal Due",
        "totalExposure": "$3.4B", "segment": "Regional Corporate"})

    # ---- L3 Legal Entities ----
    rec("L3", "Apex Americas LLC", "LE-300512", "United States", "Financial Services", "Active", {
        "parentRelationship": "Apex Americas Regional Group", "legalForm": "Limited Liability Company",
        "taxId": "US-84-2910773", "incorporationDate": "2003-06-14",
        "registeredAddress": "200 West Street, New York, NY 10282", "regulatoryStatus": "Regulated - SEC"})
    rec("L3", "Horizon Solar Generation Ltd", "LE-300618", "United States", "Energy & Utilities", "Active", {
        "parentRelationship": "Horizon Renewables Division", "legalForm": "Private Limited Company",
        "taxId": "US-47-1120934", "incorporationDate": "2011-02-28",
        "registeredAddress": "1400 Energy Plaza, Houston, TX 77002", "regulatoryStatus": "Regulated - FERC"})
    rec("L3", "Pacific Logistics GmbH", "LE-300744", "Germany", "Transportation & Logistics", "Active", {
        "parentRelationship": "Pacific Retail Logistics APAC", "legalForm": "GmbH",
        "taxId": "DE-315729014", "incorporationDate": "2008-09-05",
        "registeredAddress": "Speicherstadt 12, 20457 Hamburg", "regulatoryStatus": "Non-Regulated"})
    rec("L3", "Meridian Securities Europe SA", "LE-300820", "France", "Financial Services", "Under Review", {
        "parentRelationship": "Meridian Capital Markets EU", "legalForm": "Société Anonyme",
        "taxId": "FR-90418277351", "incorporationDate": "1999-11-19",
        "registeredAddress": "16 Rue de la Bourse, 75002 Paris", "regulatoryStatus": "Regulated - AMF"})

    # ---- L4 Financial Accounts ----
    rec("L4", "Apex Americas - USD Operating", "FA-400981", "United States", "Financial Services", "Active", {
        "parentEntity": "Apex Americas LLC", "accountType": "Operating Current Account",
        "currency": "USD", "balance": "$142,880,400", "openDate": "2015-04-12", "iban": "US64APEX0000400981"})
    rec("L4", "Horizon Solar - Revolving Credit", "FA-401044", "United States", "Energy & Utilities", "Active", {
        "parentEntity": "Horizon Solar Generation Ltd", "accountType": "Revolving Credit Facility",
        "currency": "USD", "balance": "$500,000,000", "openDate": "2018-07-30", "iban": "US64HRZN0000401044"})
    rec("L4", "Pacific Logistics - EUR Collections", "FA-401120", "Germany", "Transportation & Logistics", "Active", {
        "parentEntity": "Pacific Logistics GmbH", "accountType": "Collections Account",
        "currency": "EUR", "balance": "€38,410,220", "openDate": "2016-01-22", "iban": "DE64PACL0000401120"})
    rec("L4", "Meridian Securities - Custody", "FA-401203", "France", "Financial Services", "Dormant", {
        "parentEntity": "Meridian Securities Europe SA", "accountType": "Custody Account",
        "currency": "EUR", "balance": "€0", "openDate": "2012-03-08", "iban": "FR64MERD0000401203"})

    return records


@app.on_event("startup")
async def seed_db():
    count = await db.accounts.count_documents({})
    if count == 0:
        await db.accounts.insert_many(build_seed())
        logging.getLogger(__name__).info("Seeded accounts collection")


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
